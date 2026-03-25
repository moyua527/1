import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { isCapacitor, APP_VERSION, SERVER_URL } from '../../utils/capacitor'

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
  }
  return 0
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
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isCapacitor) return
    if (sessionStorage.getItem(`update_skip_${APP_VERSION}`)) return

    const apiUrl = `${SERVER_URL}/api/app/version`
    fetch(apiUrl)
      .then(r => r.json())
      .then(res => {
        if (!res.success || !res.data) return
        const remote = res.data as VersionInfo
        if (compareVersions(APP_VERSION, remote.version) < 0) {
          setInfo(remote)
        }
      })
      .catch(() => {})
  }, [])

  if (!info || dismissed) return null

  const isForce = info.forceUpdate || compareVersions(APP_VERSION, info.minVersion) < 0

  const handleDownload = () => {
    window.open(info.downloadUrl, '_system')
  }

  const handleDismiss = () => {
    sessionStorage.setItem(`update_skip_${APP_VERSION}`, '1')
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 340, maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '28px 24px 20px',
          color: '#fff', textAlign: 'center',
        }}>
          <Download size={36} style={{ marginBottom: 8 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>发现新版本</h3>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>
            v{APP_VERSION} → v{info.version}
          </p>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {info.changelog && (
            <div style={{
              margin: '0 0 16px', padding: 12, background: '#f8fafc',
              borderRadius: 8, fontSize: 13, color: '#475569', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#334155' }}>更新内容：</div>
              {info.changelog}
            </div>
          )}

          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px 0',
              background: '#2563eb', color: '#fff', borderRadius: 10, border: 'none',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={18} />
            立即下载安装
          </button>

          {!isForce && (
            <button
              onClick={handleDismiss}
              style={{
                display: 'block', width: '100%', marginTop: 10, padding: '10px 0',
                background: 'none', border: 'none', color: '#94a3b8',
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
