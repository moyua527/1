import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { Plus, Users, Loader2, Search, Download, Zap, Upload, Building2, UserCircle } from 'lucide-react'
import { clientApi } from './services/api'
import { can } from '../../stores/permissions'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import ClientCreateModal from './components/ClientCreateModal'
import ClientImportModal from './components/ClientImportModal'

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', alignItems: 'center', gap: 16,
}

const stageMap: Record<string, { label: string; color: string; bg: string }> = {
  potential: { label: '潜在', color: '#6b7280', bg: '#f3f4f6' },
  intent: { label: '意向', color: '#2563eb', bg: '#eff6ff' },
  signed: { label: '签约', color: '#7c3aed', bg: '#f5f3ff' },
  active: { label: '合作中', color: '#16a34a', bg: '#f0fdf4' },
  lost: { label: '流失', color: '#dc2626', bg: '#fef2f2' },
}
const stageKeys = ['all', 'potential', 'intent', 'signed', 'active', 'lost']
const stageTabLabel: Record<string, string> = { all: '全部', potential: '潜在', intent: '意向', signed: '签约', active: '合作中', lost: '流失' }

export default function ClientList() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const stageFilter = searchParams.get('stage') || 'all'
  const setStageFilter = (s: string) => { if (s === 'all') { searchParams.delete('stage'); setSearchParams(searchParams, { replace: true }) } else { setSearchParams({ stage: s }, { replace: true }) } }
  const [search, setSearch] = useState('')
  const [scores, setScores] = useState<Record<string, any>>({})
  const [showImport, setShowImport] = useState(false)
  const nav = useNavigate()
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const load = () => {
    setLoading(true)
    clientApi.list().then(r => { if (r.success) setClients(r.data || []) }).finally(() => setLoading(false))
    clientApi.allScores().then(r => { if (r.success) setScores(r.data || {}) })
  }
  useEffect(load, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>客户管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>管理所有客户信息</p>
        </div>
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
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `客户数据_${new Date().toISOString().slice(0,10)}.csv`; a.click()
          }}><Download size={16} /> 导出</Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}><Upload size={16} /> 导入</Button>
          <Button onClick={() => setShowCreate(true)}><Plus size={16} /> 新增客户</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索客户名称、公司、电话..."
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', borderRadius: 8, padding: 3, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {stageKeys.map(k => {
          const count = k === 'all' ? clients.length : clients.filter(c => (c.stage || 'potential') === k).length
          return (
            <button key={k} onClick={() => setStageFilter(k)}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: stageFilter === k ? '#fff' : 'transparent', color: stageFilter === k ? '#0f172a' : '#64748b',
                boxShadow: stageFilter === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {stageTabLabel[k]} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <Users size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>暂无客户，点击右上角新增</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '280px' : '340px'}, 1fr))`, gap: isMobile ? 10 : 16 }}>
          {clients.filter(c => {
            if (stageFilter !== 'all' && (c.stage || 'potential') !== stageFilter) return false
            if (search.trim()) {
              const q = search.trim().toLowerCase()
              return [c.name, c.company, c.phone, c.email, c.channel].some(v => v && String(v).toLowerCase().includes(q))
            }
            return true
          }).map((c: any) => {
            const s = stageMap[c.stage || 'potential'] || stageMap.potential
            return (
              <div key={c.id} style={cardStyle} onClick={() => nav(`/clients/${c.id}`)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                <Avatar name={c.name} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>#{c.id}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: c.client_type === 'individual' ? '#fef3c7' : '#dbeafe', color: c.client_type === 'individual' ? '#92400e' : '#1e40af', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{c.client_type === 'individual' ? '个人' : '企业'}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>
                  </div>
                  {c.company && <div style={{ fontSize: 13, color: '#64748b' }}>{c.company}</div>}
                  {c.channel && <div style={{ fontSize: 12, color: '#2563eb' }}>渠道: {c.channel}</div>}
                  {c.assigned_name && <div style={{ fontSize: 12, color: '#7c3aed' }}>对接人: {c.assigned_name}</div>}
                  {c.tags && c.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {c.tags.slice(0, 4).map((t: any, i: number) => (
                        <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: (t.color || '#6b7280') + '18', color: t.color || '#6b7280', fontWeight: 500 }}>{t.name}</span>
                      ))}
                      {c.tags.length > 4 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{c.tags.length - 4}</span>}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: 50 }}>
                  {scores[c.id] && (() => {
                    const sc = scores[c.id]
                    const colors: Record<string, string> = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#f97316', E: '#dc2626' }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: colors[sc.label] || '#6b7280' }}>{sc.label}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{sc.total}分</span>
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
