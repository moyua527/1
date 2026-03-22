import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, React.CSSProperties> = {
  primary: { background: '#2563eb', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: '#334155', border: '1px solid #cbd5e1' },
  ghost: { background: 'transparent', color: '#64748b', border: 'none' },
  danger: { background: '#ef4444', color: '#fff', border: 'none' },
}

const base: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  transition: 'opacity 0.15s', lineHeight: 1.4,
}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export default function Button({ variant = 'primary', style, children, ...rest }: Props) {
  return (
    <button
      type="button"
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      {...rest}
    >
      {children}
    </button>
  )
}
