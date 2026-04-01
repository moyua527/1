import type { CSSProperties } from 'react'

interface Props {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
}

export default function Skeleton({ width = '100%', height = 16, radius = 6, style }: Props) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--bg-tertiary)',
      animation: 'pulse 1.5s ease-in-out infinite',
      ...style,
    }} />
  )
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
      {Array.from({ length: cols }, (_, i) => (
        <Skeleton key={i} height={14} width={i === 0 ? 120 : undefined} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} cols={cols} />)}
    </div>
  )
}
