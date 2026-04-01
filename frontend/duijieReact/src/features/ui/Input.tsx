import React from 'react'

const base: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)',
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
  background: 'var(--bg-primary)', color: 'var(--text-body)',
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export default function Input({ label, error, helperText, style, ...rest }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <input
        style={{ ...base, ...(error ? { borderColor: 'var(--color-danger)' } : {}), ...style }}
        onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--brand)' }}
        onBlur={e => { if (!error) e.currentTarget.style.borderColor = '' }}
        {...rest}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</span>}
      {!error && helperText && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{helperText}</span>}
    </div>
  )
}
