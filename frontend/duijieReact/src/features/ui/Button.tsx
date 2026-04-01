import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--brand)', color: 'var(--text-inverse)', border: 'none' },
  secondary: { background: 'var(--bg-primary)', color: 'var(--text-body)', border: '1px solid var(--border-primary)' },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', border: 'none' },
  danger: { background: 'var(--color-danger)', color: 'var(--text-inverse)', border: 'none' },
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 12, gap: 4 },
  md: { padding: '8px 16px', fontSize: 14, gap: 6 },
  lg: { padding: '10px 20px', fontSize: 15, gap: 8 },
}

const base: React.CSSProperties = {
  borderRadius: 8, fontWeight: 500,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  transition: 'opacity 0.15s, background 0.15s', lineHeight: 1.4,
  whiteSpace: 'nowrap',
}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export default function Button({ variant = 'primary', size = 'md', loading, disabled, style, children, ...rest }: Props) {
  const isDisabled = disabled || loading
  return (
    <button
      type="button"
      disabled={isDisabled}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
        ...(isDisabled ? { opacity: 0.55, cursor: 'not-allowed' } : {}),
        ...style,
      }}
      onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.opacity = isDisabled ? '0.55' : '1' }}
      {...rest}
    >
      {loading && <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}
