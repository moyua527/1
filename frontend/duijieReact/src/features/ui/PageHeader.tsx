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
    if (!actions) return null
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
        {actions}
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
