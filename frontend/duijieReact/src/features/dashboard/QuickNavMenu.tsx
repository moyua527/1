import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'

interface NavGroup { key: string; label: string; items: { path: string; icon: any; label: string; mobileLabel?: string }[] }

export default function QuickNavMenu({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        background: 'transparent', border: 'none', borderRadius: 10,
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-secondary)',
      }}>
        <LayoutGrid size={20} />
      </button>
      {open && (
        <>
          <div onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.15)' }}
          />
          <div style={{
            position: 'absolute', top: 42, left: 0, zIndex: 200,
            background: 'var(--bg-primary)', borderRadius: 16, padding: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid var(--border-primary)',
            width: 280, maxHeight: '70vh', overflowY: 'auto',
          }}>
            {groups.map(g => (
              <div key={g.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', padding: '4px 6px', letterSpacing: '0.03em' }}>{g.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  {g.items.map(item => (
                    <div key={item.path} onClick={() => { setOpen(false); nav(item.path) }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                      }}>
                        <item.icon size={20} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{item.mobileLabel || item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
