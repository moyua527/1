import { type ElementType } from 'react'
import useIsMobile from './useIsMobile'

export interface StatCard {
  label: string
  value: number | string
  hint?: string
  color: string
  icon: ElementType
  tone?: string
}

interface Props {
  cards: StatCard[]
  columns?: number
}

export default function StatsCards({ cards, columns }: Props) {
  const isMobile = useIsMobile()
  const cols = columns ?? (isMobile ? 2 : Math.min(cards.length, 4))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginBottom: 16 }}>
      {cards.map(s => (
        <div key={s.label} style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: s.tone || 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <s.icon size={16} color={s.color} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
