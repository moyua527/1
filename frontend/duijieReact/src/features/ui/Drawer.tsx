import { useEffect, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}

export default function Drawer({ open, onClose, title, children, width = 420 }: Props) {
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.dataset.scrollY = String(scrollY)
    } else {
      const scrollY = Number(document.body.dataset.scrollY || 0)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollY)
    }
    return () => {
      const scrollY = Number(document.body.dataset.scrollY || 0)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollY)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const stopBackdropTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
  }, [])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, touchAction: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={onClose}
        onTouchMove={stopBackdropTouch} />
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width, maxWidth: '92vw',
          background: 'var(--bg-primary)', boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.2s ease',
          touchAction: 'auto',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20, touchAction: 'pan-y' }}>{children}</div>
      </div>
    </div>
  )
}
