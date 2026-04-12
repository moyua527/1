import { Shield, User } from 'lucide-react'

export const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: 'var(--color-danger)', bg: 'var(--bg-danger)', icon: Shield },
  member: { label: '成员', color: 'var(--brand)', bg: 'var(--brand-light)', icon: User },
}

export const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: '启用', color: 'var(--color-success)', bg: 'var(--bg-success)' },
  0: { label: '待审批', color: 'var(--color-warning)', bg: 'var(--bg-warning)' },
  2: { label: '禁用', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
}

export const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

export const getStatusInfo = (u: { is_active: number }) => {
  if (u.is_active === 0) return statusMap[0]
  if (u.is_active === 2) return statusMap[2]
  return statusMap[1]
}

export const roleOptions = Object.entries(roleMap).map(([k, v]) => ({ value: k, label: v.label }))
