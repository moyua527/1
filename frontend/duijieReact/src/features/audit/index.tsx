import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Shield, ChevronLeft, ChevronRight, Filter, Download, Search, X, Calendar } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useVirtualizer } from '@tanstack/react-virtual'

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
const selectStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }
const dateStyle: React.CSSProperties = { padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff', width: 140 }

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()
  const limit = 200
  const searchTimer = useRef<any>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 42,
    overscan: 10,
  })

  const buildUrl = (base: string) => {
    let url = base
    if (filterAction) url += `&action=${filterAction}`
    if (filterEntity) url += `&entity_type=${filterEntity}`
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`
    if (startDate) url += `&start_date=${startDate}`
    if (endDate) url += `&end_date=${endDate}`
    return url
  }

  const load = () => {
    fetchApi(buildUrl(`/api/audit-logs?page=${page}&limit=${limit}`)).then(r => {
      if (r.success) { setLogs(r.data.logs || []); setTotal(r.data.total || 0) }
    })
  }
  useEffect(load, [page, filterAction, filterEntity, keyword, startDate, endDate])

  const totalPages = Math.ceil(total / limit) || 1
  const hasFilters = filterAction || filterEntity || keyword || startDate || endDate
  const clearFilters = () => { setFilterAction(''); setFilterEntity(''); setKeyword(''); setSearchText(''); setStartDate(''); setEndDate(''); setPage(1) }

  const handleSearch = (v: string) => {
    setSearchText(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setKeyword(v); setPage(1) }, 400)
  }

  const exportCSV = () => {
    fetchApi(buildUrl(`/api/audit-logs?page=1&limit=10000`)).then(r => {
      if (!r.success) return
      const rows = r.data.logs || []
      const header = '\uFEFF时间,用户,操作,对象类型,对象ID,详情,IP\n'
      const csv = header + rows.map((l: any) => [
        new Date(l.created_at).toLocaleString('zh-CN'),
        l.nickname || l.username || '-',
        (actionLabel[l.action]?.label) || l.action,
        (entityLabel[l.entity_type]) || l.entity_type || '-',
        l.entity_id || '-',
        `"${(l.detail || '-').replace(/"/g, '""')}"`,
        l.ip || '-'
      ].join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `审计日志_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>审计日志</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>系统操作记录 · 共 {total} 条</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={14} /> 导出
          </button>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: showFilters ? '1px solid #2563eb' : '1px solid #e2e8f0', background: showFilters ? '#eff6ff' : '#fff', color: showFilters ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer', position: 'relative' }}>
            <Filter size={14} /> 筛选
            {hasFilters && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />}
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 4 }}>搜索</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 9 }} />
              <input value={searchText} onChange={e => handleSearch(e.target.value)} placeholder="用户/详情/IP"
                style={{ ...selectStyle, paddingLeft: 30, width: 180 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 4 }}>操作类型</label>
            <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }} style={selectStyle}>
              <option value="">全部</option>
              {Object.entries(actionLabel).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 4 }}>对象类型</label>
            <select value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1) }} style={selectStyle}>
              <option value="">全部</option>
              {Object.entries(entityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 4 }}>开始日期</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} style={dateStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 4 }}>结束日期</label>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} style={dateStyle} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 13, cursor: 'pointer', fontWeight: 500, marginBottom: 0 }}>
              <X size={13} /> 清除
            </button>
          )}
        </div>
      )}

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
          </table>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>暂无日志记录</div>
        ) : (
          <div ref={tableRef} style={{ maxHeight: 600, overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map(vRow => {
                const log = logs[vRow.index]
                const a = actionLabel[log.action] || { label: log.action, color: '#6b7280' }
                return (
                  <div key={log.id} data-index={vRow.index}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: vRow.size, transform: `translateY(${vRow.start}px)`,
                      display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#64748b', width: '18%', flexShrink: 0 }}>{new Date(log.created_at).toLocaleString('zh-CN')}</div>
                    <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500, width: '12%', flexShrink: 0 }}>{log.nickname || log.username || '-'}</div>
                    <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', width: '10%', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: a.color + '18', color: a.color, fontWeight: 600 }}>{a.label}</span>
                    </div>
                    <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#64748b', width: '14%', flexShrink: 0 }}>
                      {entityLabel[log.entity_type] || log.entity_type || '-'}
                      {log.entity_id ? ` #${log.entity_id}` : ''}
                    </div>
                    <div style={{ padding: '10px 16px', color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail || '-'}</div>
                    <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11, width: '12%', flexShrink: 0 }}>{log.ip || '-'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
