import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import useThemeStore from '../../stores/useThemeStore'
import type { ThemeMode } from '../../stores/useThemeStore'

const options: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: '浅色模式' },
  { mode: 'dark', icon: Moon, label: '深色模式' },
  { mode: 'system', icon: Monitor, label: '跟随系统' },
]

export default function ThemeToggle() {
  const mode = useThemeStore(s => s.mode)
  const setMode = useThemeStore(s => s.setMode)
  const colors = useThemeStore(s => s.colors)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = options.find(o => o.mode === mode) || options[0]
  const CurrentIcon = current.icon

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: `1px solid ${colors.borderPrimary}`, borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer', color: colors.textSecondary,
          fontSize: 13, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = colors.brandPrimary; e.currentTarget.style.color = colors.brandPrimary }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary }}
        title="切换主题"
      >
        <CurrentIcon size={15} />
        <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: colors.bgPrimary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 10,
          boxShadow: colors.shadowLg, padding: 4, minWidth: 140, zIndex: 999,
        }}>
          {options.map(({ mode: m, icon: Icon, label }) => (
            <button
              key={m}
              onClick={() => { setMode(m); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                background: mode === m ? colors.bgSelected : 'transparent',
                color: mode === m ? colors.brandPrimary : colors.textPrimary,
                fontSize: 13, fontWeight: mode === m ? 600 : 400,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (mode !== m) e.currentTarget.style.background = colors.bgHover }}
              onMouseLeave={e => { if (mode !== m) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={15} />
              {label}
              {mode === m && <span style={{ marginLeft: 'auto', color: colors.brandPrimary, fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
