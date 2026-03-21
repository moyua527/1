import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Loader2 } from 'lucide-react'
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
  const nav = useNavigate()

  const load = () => { setLoading(true); projectApi.list().then(r => { if (r.success) setProjects(r.data?.rows || []) }).finally(() => setLoading(false)) }
  useEffect(() => { load(); clientApi.list().then(r => { if (r.success) setAllClients(r.data || []) }) }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) { toast('请输入项目名称', 'error'); return }
    if (!form.client_id) { toast('请选择关联客户', 'error'); return }
    setSubmitting(true)
    const r = await projectApi.create({ ...form, client_id: Number(form.client_id) })
    setSubmitting(false)
    if (r.success) { toast('项目创建成功', 'success'); setShowCreate(false); setForm({ name: '', description: '', client_id: '' }); load() }
    else toast(r.message || '创建失败', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>项目管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>管理所有客户项目</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> 新建项目</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <FolderKanban size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>暂无项目，点击右上角新建</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
          {projects.map((p: any) => {
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
