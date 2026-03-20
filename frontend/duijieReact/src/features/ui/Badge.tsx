import React from 'react'

const colorMap: Record<string, { bg: string; color: string }> = {
  blue: { bg: '#dbeafe', color: '#1e40af' },
  green: { bg: '#dcfce7', color: '#166534' },
  yellow: { bg: '#fef3c7', color: '#92400e' },
  red: { bg: '#fee2e2', color: '#991b1b' },
  gray: { bg: '#f1f5f9', color: '#475569' },
}

interface Props { color?: string; children: React.ReactNode; style?: React.CSSProperties }

export default function Badge({ color = 'gray', children, style }: Props) {
  const c = colorMap[color] || colorMap.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 99, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color, ...style,
    }}>
      {children}
    </span>
  )
}
