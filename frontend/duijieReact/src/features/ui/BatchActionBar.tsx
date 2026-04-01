import { type ReactNode } from 'react'
import Button from './Button'

interface Props {
  selectedCount: number
  onClear: () => void
  children: ReactNode
}

export default function BatchActionBar({ selectedCount, onClear, children }: Props) {
  if (selectedCount <= 0) return null
  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--brand-light)' }}>
      <span style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>已选 {selectedCount} 项</span>
      {children}
      <button onClick={onClear} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>取消选择</button>
    </div>
  )
}
