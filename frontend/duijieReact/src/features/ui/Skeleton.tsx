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

export function SkeletonCard() {
  return (
    <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Skeleton width={36} height={36} radius={10} />
        <div style={{ flex: 1 }}>
          <Skeleton height={14} width="60%" style={{ marginBottom: 6 }} />
          <Skeleton height={10} width="40%" />
        </div>
      </div>
      <Skeleton height={10} style={{ marginBottom: 6 }} />
      <Skeleton height={10} width="80%" />
    </div>
  )
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{ padding: 16, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border-secondary)' }}>
            <Skeleton height={12} width="50%" style={{ marginBottom: 8 }} />
            <Skeleton height={28} width="40%" />
          </div>
        ))}
      </div>
      <SkeletonList rows={3} />
    </div>
  )
}
