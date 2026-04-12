import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react'

export const typeMap: Record<string, { label: string; color: string }> = {
  requirement: { label: '需求', color: 'var(--brand)' },
  bug: { label: '问题', color: 'var(--color-danger)' },
  question: { label: '咨询', color: 'var(--color-warning)' },
  other: { label: '其他', color: '#6b7280' },
}

export const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: '#6b7280' },
  medium: { label: '中', color: 'var(--color-warning)' },
  high: { label: '高', color: 'var(--color-orange)' },
  urgent: { label: '紧急', color: 'var(--color-danger)' },
}

export const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: '待处理', color: 'var(--color-warning)', icon: Clock },
  processing: { label: '处理中', color: 'var(--brand)', icon: Loader2 },
  resolved: { label: '已解决', color: 'var(--color-success)', icon: CheckCircle },
  closed: { label: '已关闭', color: '#6b7280', icon: XCircle },
}

export const fmtSize = (b: number) =>
  b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'
