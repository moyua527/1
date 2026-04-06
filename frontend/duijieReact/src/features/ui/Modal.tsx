import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number; height?: number }

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}

export default function Modal({ open, onClose, title, children, width = 600, height = 600 }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div style={overlay}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 12, width, height, maxWidth: 'calc(100vw - 24px)', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', margin: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>{children}</div>
      </div>
    </div>
  )
}
