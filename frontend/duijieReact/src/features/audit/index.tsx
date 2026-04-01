import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Shield, Filter, Download, List, Clock } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { actionLabel, entityLabel } from './constants'
import AuditFilterPanel from './AuditFilterPanel'
import AuditTable from './AuditTable'
import AuditTimeline from './AuditTimeline'

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
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()
  const limit = 200
  const searchTimer = useRef<any>(null)

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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>审计日志</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>系统操作记录 · 共 {total} 条</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 2 }}>
            <button onClick={() => setViewMode('table')} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: viewMode === 'table' ? 'var(--bg-primary)' : 'transparent', color: viewMode === 'table' ? 'var(--brand)' : 'var(--text-secondary)', boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none', fontWeight: 500 }}>
              <List size={13} /> 表格
            </button>
            <button onClick={() => setViewMode('timeline')} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: viewMode === 'timeline' ? 'var(--bg-primary)' : 'transparent', color: viewMode === 'timeline' ? 'var(--brand)' : 'var(--text-secondary)', boxShadow: viewMode === 'timeline' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none', fontWeight: 500 }}>
              <Clock size={13} /> 时间轴
            </button>
          </div>
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={14} /> 导出
          </button>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: showFilters ? '1px solid #2563eb' : '1px solid var(--border-primary)', background: showFilters ? 'var(--bg-selected)' : 'var(--bg-primary)', color: showFilters ? 'var(--brand)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', position: 'relative' }}>
            <Filter size={14} /> 筛选
            {hasFilters && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <AuditFilterPanel
          filterAction={filterAction}
          filterEntity={filterEntity}
          searchText={searchText}
          startDate={startDate}
          endDate={endDate}
          onFilterAction={v => { setFilterAction(v); setPage(1) }}
          onFilterEntity={v => { setFilterEntity(v); setPage(1) }}
          onSearch={handleSearch}
          onStartDate={v => { setStartDate(v); setPage(1) }}
          onEndDate={v => { setEndDate(v); setPage(1) }}
          onClear={clearFilters}
          hasFilters={!!hasFilters}
        />
      )}

      {viewMode === 'timeline' ? (
        <AuditTimeline logs={logs} />
      ) : (
        <AuditTable logs={logs} page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
