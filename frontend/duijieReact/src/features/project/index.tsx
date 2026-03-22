import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus, FolderKanban, Loader2, Search } from 'lucide-react'
import { projectApi } from './services/api'
import { clientApi } from '../client/services/api'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}
const statusTabs = [
  { key: '', label: '全部' },
  { key: 'planning', label: '规划中' },
  { key: 'in_progress', label: '进行中' },
  { key: 'review', label: '审核中' },
  { key: 'completed', label: '已完成' },
  { key: 'on_hold', label: '已暂停' },
]

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  cursor: 'pointer', transition: 'box-shadow 0.15s',
}

export default function ProjectList() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', client_id: '' })
  const [allClients, setAllClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const nav = useNavigate()
  const { user } = useOutletContext<{ user: any }>()
  const role = user?.role
  const canCreate = role === 'admin'

  const load = () => { setLoading(true); projectApi.list().then(r => { if (r.success) setProjects(r.data?.rows || []) }).finally(() => setLoading(false)) }
  useEffect(() => { load(); clientApi.list().then(r => { if (r.success) setAllClients(r.data || []) }) }, [])

  const filtered = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      if (!(p.name || '').toLowerCase().includes(s) && !(p.client_name || '').toLowerCase().includes(s) && !(p.description || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  const handleCreate = async () => {
    if (!form.name.trim()) { toast('请输入项目名称', 'error'); return }
    setSubmitting(true)
    if (!form.client_id) { toast('请关联客户', 'error'); setSubmitting(false); return }
    const r = await projectApi.create({ ...form, client_id: Number(form.client_id) })
    setSubmitting(false)
    if (r.success) { toast('项目创建成功', 'success'); setShowCreate(false); setForm({ name: '', description: '', client_id: '' }); load() }
    else toast(r.message || '创建失败', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>项目管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>共 {filtered.length} 个项目</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索项目..."
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', width: 180 }} />
          </div>
          {canCreate && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> 新建项目</Button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {statusTabs.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: statusFilter === t.key ? 600 : 400,
              background: statusFilter === t.key ? '#2563eb' : '#f1f5f9', color: statusFilter === t.key ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.label}
            {t.key === '' ? ` (${projects.length})` : ` (${projects.filter(p => p.status === t.key).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <FolderKanban size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>{projects.length === 0 ? '暂无项目，点击右上角新建' : '无匹配项目'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
          {filtered.map((p: any) => {
            const st = statusMap[p.status] || statusMap.planning
            return (
              <div key={p.id} style={cardStyle} onClick={() => nav(`/projects/${p.id}`)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{p.name}</h3>
                  <Badge color={st.color}>{st.label}</Badge>
                </div>
                {p.client_name && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>客户: {p.client_name}</div>}
                {p.description && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                <ProgressBar value={p.progress || 0} />
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>进度 {p.progress || 0}%</div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建项目">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="项目名称" placeholder="输入项目名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="项目描述" placeholder="简要描述" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>关联客户 <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">请选择客户</option>
              {allClients.map((c: any) => <option key={c.id} value={c.id}>#{c.id} {c.name}{c.company ? ` (${c.company})` : ''}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
