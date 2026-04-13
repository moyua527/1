import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { applyPendingBundle, getPendingBundle } from '../../utils/liveUpdate'
import { isCapacitor } from '../../utils/capacitor'

declare global {
  interface Window { __swWaiting?: ServiceWorker }
}

export default function SwUpdateBanner() {
  const [show, setShow] = useState(false)
  const [capVersion, setCapVersion] = useState('')

  useEffect(() => {
    const justUpdated = sessionStorage.getItem('sw-just-updated')
    if (justUpdated && Date.now() - Number(justUpdated) < 120000) return

    const swHandler = () => {
      const ts = sessionStorage.getItem('sw-just-updated')
      if (ts && Date.now() - Number(ts) < 120000) return
      setShow(true)
    }

    const capHandler = (e: Event) => {
      const ts = sessionStorage.getItem('sw-just-updated')
      if (ts && Date.now() - Number(ts) < 120000) return
      setCapVersion((e as CustomEvent).detail?.version || '')
      setShow(true)
    }

    window.addEventListener('sw-update-available', swHandler)
    window.addEventListener('capacitor-update-available', capHandler)
    if (window.__swWaiting) swHandler()
    if (isCapacitor) {
      const p = getPendingBundle()
      if (p) { setCapVersion(p.version); setShow(true) }
    }
    return () => {
      window.removeEventListener('sw-update-available', swHandler)
      window.removeEventListener('capacitor-update-available', capHandler)
    }
  }, [])

  if (!show) return null

  const handleUpdate = async () => {
    sessionStorage.setItem('sw-just-updated', String(Date.now()))

    if (isCapacitor && capVersion) {
      setShow(false)
      await applyPendingBundle()
      return
    }

    const w = window.__swWaiting
    if (w) w.postMessage({ type: 'SKIP_WAITING' })
    setShow(false)
    setTimeout(() => window.location.reload(), 300)
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
      <span>新版本{capVersion ? ` v${capVersion} ` : ''}已就绪</span>
      <button onClick={handleUpdate} style={{
        background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff',
        padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        cursor: 'pointer',
      }}>
        立即更新
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
