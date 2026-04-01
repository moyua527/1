import React from 'react'

const base: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, style, ...rest }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{label}</label>}
      <input
        style={{ ...base, ...style }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--text-disabled)')}
        {...rest}
      />
    </div>
  )
}
