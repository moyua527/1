import type { ReactNode } from 'react'

interface Item {
  label: string
  value: ReactNode
}

interface Props {
  items: Item[]
  columns?: number
}

export default function InfoGrid({ items, columns = 2 }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '12px 24px' }}>
      {items.map(item => (
        <div key={item.label}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>{item.label}</div>
          <div style={{ fontSize: 14, color: 'var(--text-body)' }}>{item.value ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}
