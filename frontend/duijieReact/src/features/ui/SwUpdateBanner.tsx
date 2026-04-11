import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

declare global {
  interface Window { __swWaiting?: ServiceWorker }
}

export default function SwUpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const justUpdated = sessionStorage.getItem('sw-just-updated')
    if (justUpdated && Date.now() - Number(justUpdated) < 60000) return

    const handler = () => {
      const ts = sessionStorage.getItem('sw-just-updated')
      if (ts && Date.now() - Number(ts) < 60000) return
      setShow(true)
    }
    window.addEventListener('sw-update-available', handler)
    if (window.__swWaiting) handler()
    return () => window.removeEventListener('sw-update-available', handler)
  }, [])

  if (!show) return null

  const handleUpdate = () => {
    sessionStorage.setItem('sw-just-updated', String(Date.now()))
    const w = window.__swWaiting
    if (w) {
      w.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9990, display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--brand)', color: '#fff', padding: '10px 18px',
      borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
      animation: 'fadeIn 0.3s ease',
    }}>
      <RefreshCw size={15} />
      <span>有新版本可用</span>
      <button onClick={handleUpdate} style={{
        background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff',
        padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        cursor: 'pointer',
      }}>
        更新
      </button>
      <button onClick={() => setShow(false)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
        padding: '2px 4px', fontSize: 16, cursor: 'pointer', lineHeight: 1,
      }}>
        ×
      </button>
    </div>
  )
}
