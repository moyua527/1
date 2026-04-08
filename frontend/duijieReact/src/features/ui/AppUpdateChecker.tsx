import { useEffect, useState } from 'react'
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
  downloadUrl: string
  forceUpdate: boolean
  changelog: string
}

export default function AppUpdateChecker() {
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [nativeVer, setNativeVer] = useState('')
  const [dismissed, setDismissed] = useState(false)

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
      if (compareVersions(localVer, remote.version) < 0) {
        setInfo(remote)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (!info || dismissed) return null

  const isForce = info.forceUpdate || compareVersions(nativeVer, info.minVersion) < 0

  const [copied, setCopied] = useState(false)

  const handleDownload = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'DuiJie 更新 v' + info.version, url: info.downloadUrl })
        return
      } catch { /* user cancelled or not supported */ }
    }
    handleCopy()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(info.downloadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      window.prompt('长按复制下载链接：', info.downloadUrl)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem(`update_skip_${nativeVer}`, '1')
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

          {!isForce && (
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
