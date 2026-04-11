import { type ReactNode } from 'react'
import useIsMobile from './useIsMobile'

interface Props {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <div style={{
        position: 'sticky', top: -20, zIndex: 10,
        background: 'var(--bg-secondary)', margin: '-20px -16px 12px', padding: '16px 16px 10px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: actions ? 8 : 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>{title}</h1>
        </div>
        {actions && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-tertiary)', margin: '2px 0 0', fontSize: 13 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}
