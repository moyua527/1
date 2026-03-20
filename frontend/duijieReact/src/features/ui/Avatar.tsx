import React from 'react'

interface Props { name: string; size?: number; src?: string }

const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

export default function Avatar({ name, size = 36, src }: Props) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: colors[idx],
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 600, flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
