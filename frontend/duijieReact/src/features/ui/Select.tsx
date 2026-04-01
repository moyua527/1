import React from 'react'

interface Option { value: string; label: string }

interface Props extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
}

const base: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none',
  transition: 'border-color 0.15s', boxSizing: 'border-box',
  background: 'var(--bg-primary)', color: 'var(--text-body)',
  cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 32,
}

export default function Select({ label, options, value, onChange, placeholder, error, style, disabled, ...rest }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          ...base,
          ...(error ? { borderColor: 'var(--color-danger)' } : {}),
          ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          ...style,
        }}
        onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--brand)' }}
        onBlur={e => { if (!error) e.currentTarget.style.borderColor = '' }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}
