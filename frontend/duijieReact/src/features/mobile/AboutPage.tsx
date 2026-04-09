import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Loader2, Download, RefreshCw } from 'lucide-react'
import { isCapacitor, APP_VERSION, SERVER_URL } from '../../utils/capacitor'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'

type VersionEntry = { ver: string; date: string; desc: string }

function compareVer(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
  }
  return 0
}

export default function AboutPage() {
  const [checking, setChecking] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [serverVersion, setServerVersion] = useState(APP_VERSION)
  const [versionLog, setVersionLog] = useState<VersionEntry[]>([])
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState('')

  useEffect(() => {
    fetchApi('/api/app/version?changelog=1').then(r => {
      if (r.success && r.data) {
        if (r.data.version) setServerVersion(r.data.version)
        if (r.data.changelogList?.length) setVersionLog(r.data.changelogList)
        if (r.data.downloadUrl) setDownloadUrl(r.data.downloadUrl)
      }
    }).catch(() => {})
  }, [])

  const checkUpdate = async () => {
    setChecking(true)
    try {
      const r = await fetchApi('/api/app/version')
      if (r.success && r.data) {
        setServerVersion(r.data.version)
        if (r.data.downloadUrl) setDownloadUrl(r.data.downloadUrl)
        if (compareVer(APP_VERSION, r.data.version) < 0) {
          setUpdateAvailable(true)
          toast(`发现新版本 v${r.data.version}`, 'success')
        } else {
          toast('已是最新版本', 'success')
        }
      } else {
        toast('已是最新版本', 'success')
      }
    } catch {
      toast('检查更新失败', 'error')
    }
    setChecking(false)
  }

  const handleInAppUpdate = async () => {
    if (updating) return
    setUpdating(true)

    if (isCapacitor) {
      try {
        setUpdateProgress('正在获取更新信息...')
        const res = await fetchApi('/api/app/bundle')
        if (!res.success || !res.data?.url || !res.data?.version) {
          toast('没有可用的更新包', 'error')
          setUpdating(false); setUpdateProgress('')
          return
        }

        let bundleUrl = res.data.url
        if (!bundleUrl.startsWith('http')) {
          bundleUrl = `${SERVER_URL}${bundleUrl.startsWith('/') ? '' : '/'}${bundleUrl}`
        } else if (isCapacitor) {
          bundleUrl = bundleUrl.replace(/https?:\/\/[^/]+/, SERVER_URL)
        }

        const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
        setUpdateProgress('正在下载更新包...')
        const bundle = await CapacitorUpdater.download({
          url: bundleUrl,
          version: res.data.version,
        })

        setUpdateProgress('正在应用更新，即将重启...')
        await CapacitorUpdater.set(bundle)
      } catch (e: any) {
        const msg = e?.message || e?.errorMessage || String(e)
        console.warn('[Update] Error:', msg, e)
        toast(`更新失败: ${msg}`, 'error')
        setUpdating(false); setUpdateProgress('')
      }
    } else {
      window.location.reload()
    }
  }

  const startDownload = async () => {
    const url = downloadUrl || `${SERVER_URL}/downloads/duijie.apk`
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
    } catch {
      window.open(url, '_blank') || (window.location.href = url)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ marginTop: 32, marginBottom: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>D</span>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>DuiJie</div>
        <div style={{ fontSize: 15, color: 'var(--text-tertiary)', marginBottom: 32 }}>Version {APP_VERSION}</div>

        <div style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div onClick={() => setShowLog(!showLog)} style={{
            display: 'flex', alignItems: 'center', padding: '16px 18px', cursor: 'pointer',
            borderBottom: '1px solid var(--border-secondary)',
          }}>
            <span style={{ flex: 1, fontSize: 16, color: 'var(--text-primary)' }}>功能介绍</span>
            {showLog
              ? <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />
              : <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />}
          </div>
          <div onClick={(!updateAvailable && !checking) ? checkUpdate : undefined} style={{
            padding: '16px 18px', cursor: (updateAvailable || checking) ? 'default' : 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1, fontSize: 16, color: 'var(--text-primary)' }}>版本更新</span>
              {checking ? (
                <Loader2 size={16} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
              ) : updateAvailable ? (
                <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>v{serverVersion} 可用</span>
              ) : (
                <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
              )}
            </div>

            {updateAvailable && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  当前 v{APP_VERSION} → 最新 v{serverVersion}
                </div>
                {updateProgress && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', background: 'var(--bg-selected)', borderRadius: 10,
                    fontSize: 13, color: 'var(--brand)', fontWeight: 500,
                  }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    {updateProgress}
                  </div>
                )}
                <button onClick={handleInAppUpdate} disabled={updating} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px 0',
                  background: updating ? 'var(--bg-tertiary)' : 'var(--brand)',
                  color: updating ? 'var(--text-tertiary)' : '#fff',
                  borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 600,
                  cursor: updating ? 'default' : 'pointer', opacity: updating ? 0.7 : 1,
                }}>
                  <RefreshCw size={16} />
                  {updating ? '更新中...' : '应用内更新'}
                </button>
                <button onClick={startDownload} disabled={updating} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '10px 0', background: 'transparent',
                  color: updating ? 'var(--text-disabled)' : 'var(--text-secondary)',
                  borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 13, fontWeight: 500,
                  cursor: updating ? 'default' : 'pointer',
                }}>
                  <Download size={14} />
                  下载完整安装包
                </button>
              </div>
            )}
          </div>
        </div>

        {showLog && versionLog.length > 0 && (
          <div style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: 16, padding: '4px 0', marginBottom: 16, maxHeight: '50vh', overflowY: 'auto' }}>
            {versionLog.map((item, i) => (
              <div key={item.ver} style={{
                padding: '14px 18px',
                borderBottom: i < versionLog.length - 1 ? '1px solid var(--border-secondary)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: item.ver === serverVersion ? 'var(--brand)' : 'var(--text-heading)' }}>
                    v{item.ver} {item.ver === serverVersion && '(当前)'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{item.date}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 4 }}>DuiJie · 轻量级项目协作平台</div>
          <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>Copyright &copy; 2024-{new Date().getFullYear()} DuiJie. All Rights Reserved.</div>
        </div>
      </div>
    </div>
  )
}
