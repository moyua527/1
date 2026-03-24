export default function Skeleton({ width, height, radius = 8, style }: { width?: number | string; height?: number | string; radius?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height: height ?? 16,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
      <Skeleton height={20} width="60%" />
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Skeleton height={14} width="30%" />
        <Skeleton height={14} width="20%" />
      </div>
      <Skeleton height={14} width="80%" style={{ marginTop: 10 }} />
      <Skeleton height={14} width="50%" style={{ marginTop: 6 }} />
    </div>
  )
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Skeleton width={36} height={36} radius={18} />
          <div style={{ flex: 1 }}>
            <Skeleton height={14} width={`${60 + (i % 3) * 10}%`} />
            <Skeleton height={12} width={`${30 + (i % 4) * 10}%`} style={{ marginTop: 6 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
            <Skeleton height={12} width="40%" />
            <Skeleton height={28} width="60%" style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', height: 200 }}>
          <Skeleton height={16} width="30%" />
          <Skeleton height={140} style={{ marginTop: 16 }} radius={8} />
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', height: 200 }}>
          <Skeleton height={16} width="30%" />
          <Skeleton height={140} style={{ marginTop: 16 }} radius={8} />
        </div>
      </div>
    </div>
  )
}
