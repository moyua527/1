import type { ReactNode, CSSProperties } from 'react'

interface Props {
  title?: string
  subtitle?: string
  extra?: ReactNode
  children: ReactNode
  padding?: number
  style?: CSSProperties
}

export default function SectionCard({ title, subtitle, extra, children, padding = 20, style }: Props) {
  return (
    <div style={{
      background: 'var(--bg-primary)', borderRadius: 12,
      border: '1px solid var(--border-primary)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      ...style,
    }}>
      {(title || extra) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-secondary)' }}>
          <div>
            {title && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  )
}
