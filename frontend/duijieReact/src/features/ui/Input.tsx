import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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

export default function Input({ label, error, helperText, style, type, ...rest }: Props) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && showPwd ? 'text' : type}
          style={{ ...base, ...(isPassword ? { paddingRight: 40 } : {}), ...(error ? { borderColor: 'var(--color-danger)' } : {}), ...style }}
          onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--brand)' }}
          onBlur={e => { if (!error) e.currentTarget.style.borderColor = '' }}
          {...rest}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: 4, cursor: 'pointer',
              color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</span>}
      {!error && helperText && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{helperText}</span>}
    </div>
  )
}
