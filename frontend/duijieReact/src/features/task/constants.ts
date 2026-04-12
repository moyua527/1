export const columns = [
  { key: 'submitted', label: '已提出', color: 'var(--brand)', bg: 'var(--bg-selected)' },
  { key: 'disputed', label: '待补充', color: 'var(--color-warning)', bg: '#fffbeb' },
  { key: 'in_progress', label: '执行中', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'pending_review', label: '待验收', color: '#ea580c', bg: '#fff7ed' },
  { key: 'review_failed', label: '验收不通过', color: 'var(--color-danger)', bg: '#fef2f2' },
  { key: 'accepted', label: '验收通过', color: 'var(--color-success)', bg: '#f0fdf4' },
]

export const statusMap: Record<string, { label: string; color: string; bg: string }> =
  Object.fromEntries(columns.map(c => [c.key, { label: c.label, color: c.color, bg: c.bg }]))

export const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'gray' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'yellow' },
  urgent: { label: '紧急', color: 'red' },
}

export const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name)

export const fmtSize = (b: number) =>
  b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'
