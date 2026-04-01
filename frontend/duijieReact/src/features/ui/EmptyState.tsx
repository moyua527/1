import { type ElementType, type ReactNode } from 'react'
import Button from './Button'

interface Props {
  icon?: ElementType
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void; icon?: ElementType }
  children?: ReactNode
}

export default function EmptyState({ icon: Icon, title, subtitle, action, children }: Props) {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      {Icon && <Icon size={40} color="var(--text-disabled)" style={{ marginBottom: 12 }} />}
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>{subtitle}</div>}
      {action && (
        <Button onClick={action.onClick} style={{ fontSize: 13 }}>
          {action.icon && <action.icon size={14} />} {action.label}
        </Button>
      )}
      {children}
    </div>
  )
}
