import { useEffect, type ReactNode } from 'react'
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
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width, maxWidth: '92vw',
        background: 'var(--bg-primary)', boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}
