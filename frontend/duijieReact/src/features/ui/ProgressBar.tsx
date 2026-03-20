import React from 'react'

interface Props { value: number; color?: string; height?: number }

export default function ProgressBar({ value, color = '#2563eb', height = 6 }: Props) {
  return (
    <div style={{ width: '100%', background: '#e2e8f0', borderRadius: height, height, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, height: '100%', borderRadius: height, transition: 'width 0.3s' }} />
    </div>
  )
}
