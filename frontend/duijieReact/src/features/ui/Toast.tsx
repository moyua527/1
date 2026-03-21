import { useState, useEffect, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info'

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
  const [current, setCurrent] = useState<{ message: string; type: ToastType } | null>(null)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<any>(null)
  const fadeRef = useRef<any>(null)

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (fadeRef.current) clearTimeout(fadeRef.current)
    setFading(false)
    setCurrent({ message, type })
    timerRef.current = setTimeout(() => {
      setFading(true)
      fadeRef.current = setTimeout(() => { setCurrent(null); setFading(false) }, 400)
    }, 1500)
  }, [])

  useEffect(() => { addToastGlobal = addToast; return () => { addToastGlobal = null } }, [addToast])

  if (!current) return null
  const c = colors[current.type]

  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, pointerEvents: 'none' }}>
      <div style={{
        padding: '12px 24px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`,
        color: c.text, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease', whiteSpace: 'nowrap',
      }}>
        {current.message}
      </div>
    </div>
  )
}
