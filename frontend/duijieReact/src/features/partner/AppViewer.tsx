import { useState, useRef } from 'react'
import { ArrowLeft, Maximize2, Minimize2, RefreshCw, ExternalLink, Monitor } from 'lucide-react'
import type { Partner } from './constants'

export default function AppViewer({ partner, onBack }: { partner: Partner; onBack: () => void }) {
  const [fullscreen, setFullscreen] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const appUrl = partner.partner_url?.replace(/\/+$/, '') || ''

  const handleReload = () => {
    setLoading(true)
    setLoadError(false)
    if (iframeRef.current) {
      iframeRef.current.src = appUrl
    }
  }

  const wrapperStyle: React.CSSProperties = fullscreen
    ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }
    : { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }

  return (
    <div style={wrapperStyle}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }} title="返回">
          <ArrowLeft size={16} />
        </button>

        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-selected)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Monitor size={15} color="var(--brand)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{partner.partner_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{appUrl}</div>
        </div>

        <button onClick={handleReload} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }} title="刷新">
          <RefreshCw size={15} />
        </button>
        <a href={appUrl} target="_blank" rel="noreferrer" style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)', textDecoration: 'none' }} title="新窗口打开">
          <ExternalLink size={15} />
        </a>
        <button onClick={() => setFullscreen(!fullscreen)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }} title={fullscreen ? '退出全屏' : '全屏'}>
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* iframe 区域 */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-tertiary)' }}>
        {loading && !loadError && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: 'var(--bg-card)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border-primary)', borderTop: '3px solid var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>正在加载 {partner.partner_name}...</div>
            </div>
          </div>
        )}

        {loadError && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, background: 'var(--bg-card)' }}>
            <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Monitor size={32} color="var(--color-danger)" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-primary)' }}>无法在页面内嵌入</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                对方的系统禁止了页面内嵌。你可以在新窗口中打开使用，或联系对方开发者解除限制。
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href={appUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: 'var(--brand)', color: 'var(--text-inverse)', borderRadius: 10, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
                  <ExternalLink size={15} /> 新窗口打开 {partner.partner_name}
                </a>
                <button onClick={handleReload}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderRadius: 10, fontSize: 14, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  <RefreshCw size={14} /> 重试
                </button>
              </div>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={appUrl}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setLoadError(true) }}
          style={{ width: '100%', height: '100%', border: 'none', display: loadError ? 'none' : 'block' }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
