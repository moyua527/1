import React from 'react'

interface Props { value: number; color?: string; height?: number }

export default function ProgressBar({ value, color = 'var(--brand)', height = 6 }: Props) {
  return (
    <div style={{ width: '100%', background: 'var(--border-primary)', borderRadius: height, height, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, height: '100%', borderRadius: height, transition: 'width 0.3s' }} />
    </div>
  )
}
