import { useEffect, useState, useRef } from 'react'
import { Download } from 'lucide-react'
import { isCapacitor, SERVER_URL } from '../../utils/capacitor'

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
  }
  return 0
}

async function getNativeVersion(): Promise<string> {
  try {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    return info.version
  } catch {
    return '0.0.0'
  }
}

interface VersionInfo {
  version: string
  versionCode: number
  minVersion: string
  nativeMinVersion: string
  downloadUrl: string
  forceUpdate: boolean
  changelog: string
}

export default function AppUpdateChecker() {
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [nativeVer, setNativeVer] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(-1)
  const [downloadedMB, setDownloadedMB] = useState('')
  const [downloadDone, setDownloadDone] = useState(false)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  useEffect(() => {
    if (!isCapacitor) return

    let cancelled = false
    ;(async () => {
      const localVer = await getNativeVersion()
      if (cancelled) return
      setNativeVer(localVer)

      if (sessionStorage.getItem(`update_skip_${localVer}`)) return

      const apiUrl = `${SERVER_URL}/api/app/version`
      const res = await fetch(apiUrl).then(r => r.json()).catch(() => null)
      if (cancelled || !res?.success || !res.data) return

      const remote = res.data as VersionInfo
      const nativeMin = remote.nativeMinVersion || remote.minVersion || '0.0.0'
      if (compareVersions(localVer, nativeMin) < 0) {
        setInfo(remote)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (!info || dismissed) return null

  const isForce = info.forceUpdate || compareVersions(nativeVer, info.minVersion) < 0
  const downloadUrl = info.downloadUrl || `${SERVER_URL}/downloads/duijie.apk`
  const isDownloading = progress >= 0

  const openDownloadLink = async () => {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: downloadUrl })
    } catch {
      window.location.href = downloadUrl
    }
  }

  const handleDownload = () => {
    if (isDownloading) return
    setProgress(0)
    setDownloadedMB('0')

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr
    xhr.open('GET', downloadUrl, true)
    xhr.responseType = 'arraybuffer'

    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100))
        setDownloadedMB(`${(e.loaded / 1048576).toFixed(1)}/${(e.total / 1048576).toFixed(1)}`)
      } else {
        setDownloadedMB(`${(e.loaded / 1048576).toFixed(1)}MB`)
      }
    }

    xhr.onload = () => {
      setProgress(100)
      setDownloadDone(true)
    }

    xhr.onerror = () => {
      setProgress(-1)
      openDownloadLink()
    }

    xhr.send()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      window.prompt('长按复制下载链接：', downloadUrl)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem(`update_skip_${nativeVer}`, '1')
    if (xhrRef.current) { try { xhrRef.current.abort() } catch {} }
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 16, width: 340, maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '28px 24px 20px',
          color: 'var(--bg-primary)', textAlign: 'center',
        }}>
          <Download size={36} style={{ marginBottom: 8 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>发现新版本</h3>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>
            v{nativeVer} → v{info.version}
          </p>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {info.changelog && (
            <div style={{
              margin: '0 0 16px', padding: 12, background: 'var(--bg-secondary)',
              borderRadius: 8, fontSize: 13, color: '#475569', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-body)' }}>更新内容：</div>
              {info.changelog}
            </div>
          )}

          {downloadDone ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: 14, marginBottom: 10, color: '#22c55e', fontWeight: 600 }}>
                下载完成！
              </div>
              <button
                onClick={openDownloadLink}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px 0',
                  background: '#22c55e', color: '#fff', borderRadius: 10, border: 'none',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Download size={18} />
                点击安装
              </button>
            </div>
          ) : isDownloading ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>
                <span>正在下载...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: 'var(--brand)',
                  width: `${progress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              {downloadedMB && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'center' }}>
                  {downloadedMB} MB
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '13px 0',
                background: 'var(--brand)', color: 'var(--bg-primary)', borderRadius: 10, border: 'none',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Download size={18} />
              立即下载安装
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '10px 0', marginTop: 8,
              background: 'var(--bg-secondary)', color: 'var(--text-body)', borderRadius: 10, border: 'none',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            {copied ? '已复制！请在浏览器中粘贴打开' : '复制下载链接（在浏览器中打开）'}
          </button>

          {!isForce && !isDownloading && (
            <button
              onClick={handleDismiss}
              style={{
                display: 'block', width: '100%', marginTop: 10, padding: '10px 0',
                background: 'none', border: 'none', color: 'var(--text-tertiary)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              稍后再说
            </button>
          )}

          {isForce && (
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#ef4444' }}>
              当前版本过旧，请更新后使用
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
