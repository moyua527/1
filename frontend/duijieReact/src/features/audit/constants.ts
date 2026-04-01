export const actionLabel: Record<string, { label: string; color: string }> = {
  create: { label: '创建', color: '#16a34a' },
  update: { label: '更新', color: '#2563eb' },
  delete: { label: '删除', color: '#dc2626' },
  login: { label: '登录', color: '#7c3aed' },
  logout: { label: '登出', color: '#6b7280' },
}

export const entityLabel: Record<string, string> = {
  project: '项目', task: '任务', client: '客户', ticket: '工单', user: '用户', auth: '认证',
}

export const selectStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }
export const dateStyle: React.CSSProperties = { padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff', width: 140 }
