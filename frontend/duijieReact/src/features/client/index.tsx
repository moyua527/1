import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { Plus, Users, Download, Upload } from 'lucide-react'
import { clientApi } from './services/api'
import { useClients, useInvalidate } from '../../hooks/useApi'
import useLiveData from '../../hooks/useLiveData'
import useDebounce from '../../hooks/useDebounce'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import PageHeader from '../ui/PageHeader'
import FilterBar from '../ui/FilterBar'
import EmptyState from '../ui/EmptyState'
import { SkeletonList } from '../ui/Skeleton'
import ClientCreateModal from './components/ClientCreateModal'
import ClientImportModal from './components/ClientImportModal'
import { stageMap } from './components/constants'

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', alignItems: 'center', gap: 16,
}


export default function ClientList() {
  const { data: clients = [], isLoading: loading } = useClients()
  const invalidate = useInvalidate()
  const [showCreate, setShowCreate] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const stageFilter = searchParams.get('stage') || ''
  const setStageFilter = (s: string) => { if (!s) { searchParams.delete('stage'); setSearchParams(searchParams, { replace: true }) } else { setSearchParams({ stage: s }, { replace: true }) } }
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [scores, setScores] = useState<Record<string, any>>({})
  const [showImport, setShowImport] = useState(false)
  const nav = useNavigate()
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  useEffect(() => {
    clientApi.allScores().then(r => { if (r.success) setScores(r.data || {}) })
  }, [])
  const load = () => invalidate('clients')
  useLiveData(['client'], load)

  const filtered = useMemo(() => clients.filter(c => {
    if (stageFilter && (c.stage || 'potential') !== stageFilter) return false
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      return [c.name, c.company, c.phone, c.email, c.channel].some(v => v && String(v).toLowerCase().includes(q))
    }
    return true
  }), [clients, stageFilter, debouncedSearch])

  return (
    <div>
      <PageHeader title="客户管理" subtitle="管理所有客户信息" actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => {
            const headers = ['客户名称', '公司', '渠道', '阶段', '邮箱', '电话', '职位级别', '部门', '工作职能', '标签', '创建时间']
            const stageLabel: Record<string, string> = { potential: '潜在', intent: '意向', signed: '签约', active: '合作中', lost: '流失' }
            const rows = clients.map(c => [
              c.name, c.company || '', c.channel || '', stageLabel[c.stage || 'potential'] || c.stage || '',
              c.email || '', c.phone || '', c.position_level || '', c.department || '', c.job_function || '',
              (c.tags || []).map((t: any) => t.name).join('/'),
              new Date(c.created_at).toLocaleDateString('zh-CN'),
            ])
            const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `客户数据_${new Date().toISOString().slice(0,10)}.csv`; a.click()
            URL.revokeObjectURL(url)
          }}><Download size={16} /> 导出</Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}><Upload size={16} /> 导入</Button>
          <Button onClick={() => setShowCreate(true)}><Plus size={16} /> 新增客户</Button>
        </div>
      } />

      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="搜索客户名称、公司、电话..."
        filters={[{
          value: stageFilter, onChange: setStageFilter, placeholder: '全部阶段',
          options: Object.entries(stageMap).map(([k, v]) => ({ value: k, label: v.label })),
        }]}
        resultCount={filtered.length} hasFilters={!!stageFilter || !!search.trim()}
        activeFilterCount={(stageFilter ? 1 : 0) + (search.trim() ? 1 : 0)}
        onClearFilters={() => { setStageFilter(''); setSearch('') }}
      />

      {loading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={clients.length === 0 ? '暂无客户' : '无匹配客户'}
          subtitle={clients.length === 0 ? '点击右上角新增客户' : '调整筛选条件试试'}
          action={clients.length === 0 ? { label: '新增客户', onClick: () => setShowCreate(true) } : undefined} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '280px' : '340px'}, 1fr))`, gap: isMobile ? 10 : 16 }}>
          {filtered.map((c: any) => {
            const s = stageMap[c.stage || 'potential'] || stageMap.potential
            return (
              <div key={c.id} style={cardStyle} onClick={() => nav(`/clients/${c.id}`)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                <Avatar name={c.name} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>#{c.id}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{c.name}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: c.client_type === 'individual' ? '#fef3c7' : 'var(--brand-light-2)', color: c.client_type === 'individual' ? '#92400e' : 'var(--brand)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{c.client_type === 'individual' ? '个人' : '企业'}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>
                  </div>
                  {c.company && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.company}</div>}
                  {c.channel && <div style={{ fontSize: 12, color: 'var(--brand)' }}>渠道: {c.channel}</div>}
                  {c.assigned_name && <div style={{ fontSize: 12, color: 'var(--color-purple)' }}>对接人: {c.assigned_name}</div>}
                  {c.tags && c.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {c.tags.slice(0, 4).map((t: any, i: number) => (
                        <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: (t.color || '#6b7280') + '18', color: t.color || '#6b7280', fontWeight: 500 }}>{t.name}</span>
                      ))}
                      {c.tags.length > 4 && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>+{c.tags.length - 4}</span>}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: 50 }}>
                  {scores[c.id] && (() => {
                    const sc = scores[c.id]
                    const colors: Record<string, string> = { A: 'var(--color-success)', B: 'var(--brand)', C: 'var(--color-warning)', D: '#f97316', E: 'var(--color-danger)' }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: colors[sc.label] || '#6b7280' }}>{sc.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{sc.total}分</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ClientCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
      <ClientImportModal open={showImport} onClose={() => setShowImport(false)} onImported={load} />
    </div>
  )
}
