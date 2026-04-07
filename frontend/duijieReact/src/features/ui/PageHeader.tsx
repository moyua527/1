import { type ReactNode } from 'react'
import useIsMobile from './useIsMobile'

interface Props {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start', marginBottom: isMobile ? 12 : 24, flexWrap: 'wrap', gap: isMobile ? 8 : 12, flexDirection: isMobile ? 'row' : 'row' }}>
      <div style={{ flex: isMobile ? 1 : undefined, minWidth: 0 }}>
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-tertiary)', margin: '2px 0 0', fontSize: isMobile ? 11 : 13 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}
