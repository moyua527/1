import { useState, useEffect, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; type: ToastType }

const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
}

let addToastGlobal: ((message: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'info') {
  if (addToastGlobal) addToastGlobal(message, type)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  useEffect(() => { addToastGlobal = addToast; return () => { addToastGlobal = null } }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => {
        const c = colors[t.type]
        return (
          <div key={t.id} style={{
            padding: '10px 16px', borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`,
            color: c.text, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.2s ease', minWidth: 200, maxWidth: 360,
          }}>
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
