import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--color-danger, #ef4444)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '8px 16px', fontSize: 13, fontWeight: 500,
    }}>
      <WifiOff size={14} />
      网络已断开，请检查网络连接
    </div>
  )
}
