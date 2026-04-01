import type { ReactNode } from 'react'
import Button from './Button'

/* ── FormSection: 表单区域标题 ── */
interface SectionProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function FormSection({ title, subtitle, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{subtitle}</div>}
      {!subtitle && <div style={{ marginBottom: 12 }} />}
      {children}
    </div>
  )
}

/* ── FormGrid: 多列表单布局 ── */
interface GridProps {
  columns?: number
  gap?: number
  children: ReactNode
}

export function FormGrid({ columns = 2, gap = 16, children }: GridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
      {children}
    </div>
  )
}

/* ── FormActions: 表单底部操作栏 ── */
interface ActionsProps {
  onSubmit?: () => void
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
  disabled?: boolean
  children?: ReactNode
}

export function FormActions({ onSubmit, onCancel, submitText = '保存', cancelText = '取消', loading, disabled, children }: ActionsProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 20, borderTop: '1px solid var(--border-secondary)', marginTop: 8 }}>
      {children}
      {onCancel && <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>}
      {onSubmit && <Button onClick={onSubmit} loading={loading} disabled={disabled}>{submitText}</Button>}
    </div>
  )
}
