import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Shield, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { fetchApi } from '../../bootstrap'

const actionLabel: Record<string, { label: string; color: string }> = {
  create: { label: '创建', color: '#16a34a' },
  update: { label: '更新', color: '#2563eb' },
  delete: { label: '删除', color: '#dc2626' },
  login: { label: '登录', color: '#7c3aed' },
  logout: { label: '登出', color: '#6b7280' },
}
const entityLabel: Record<string, string> = {
  project: '项目', task: '任务', client: '客户', ticket: '工单', user: '用户', auth: '认证',
}

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()
  const limit = 30

  const load = () => {
    let url = `/api/audit-logs?page=${page}&limit=${limit}`
    if (filterAction) url += `&action=${filterAction}`
    if (filterEntity) url += `&entity_type=${filterEntity}`
    fetchApi(url).then(r => {
      if (r.success) { setLogs(r.data.logs || []); setTotal(r.data.total || 0) }
    })
  }
  useEffect(load, [page, filterAction, filterEntity])

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>审计日志</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>系统操作记录 · 共 {total} 条</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={16} color="#64748b" />
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}>
            <option value="">全部操作</option>
            {Object.entries(actionLabel).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1) }}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}>
            <option value="">全部类型</option>
            {Object.entries(entityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>时间</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>用户</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>操作</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>对象</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>详情</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>暂无日志记录</td></tr>
              ) : logs.map(log => {
                const a = actionLabel[log.action] || { label: log.action, color: '#6b7280' }
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#64748b' }}>{new Date(log.created_at).toLocaleString('zh-CN')}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>{log.nickname || log.username || '-'}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: a.color + '18', color: a.color, fontWeight: 600 }}>{a.label}</span>
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#64748b' }}>
                      {entityLabel[log.entity_type] || log.entity_type || '-'}
                      {log.entity_id ? ` #${log.entity_id}` : ''}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#334155', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail || '-'}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{log.ip || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', color: page <= 1 ? '#cbd5e1' : '#64748b' }}>
              <ChevronLeft size={16} /> 上一页
            </button>
            <span style={{ fontSize: 13, color: '#64748b' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page >= totalPages ? 'default' : 'pointer', color: page >= totalPages ? '#cbd5e1' : '#64748b' }}>
              下一页 <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
