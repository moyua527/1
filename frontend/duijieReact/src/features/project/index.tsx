import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus, FolderKanban, Loader2, Download } from 'lucide-react'
import { projectApi } from './services/api'
import { can } from '../../stores/permissions'
import { useProjects, useInvalidate } from '../../hooks/useApi'
import useEnterpriseStore from '../../stores/useEnterpriseStore'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'
import PageHeader from '../ui/PageHeader'
import FilterBar from '../ui/FilterBar'
import EmptyState from '../ui/EmptyState'

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
  background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  cursor: 'pointer', transition: 'box-shadow 0.15s',
}

export default function ProjectList() {
  const { data: projects = [], isLoading: loading } = useProjects()
  const invalidate = useInvalidate()
  const { activeEnterpriseId } = useEnterpriseStore()
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const nav = useNavigate()
  const { user, isMobile } = useOutletContext<{ user: any; isMobile?: boolean }>()
  const canCreate = can(user?.role || '', 'project:create')

  const load = () => invalidate('projects')

  const filtered = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      if (!(p.name || '').toLowerCase().includes(s)
        && !(p.client_name || '').toLowerCase().includes(s)
        && !(p.internal_client_name || '').toLowerCase().includes(s)
        && !(p.description || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  const handleCreate = async () => {
    if (!form.name.trim()) { toast('请输入项目名称', 'error'); return }
    setSubmitting(true)
    const r = await projectApi.create(form)
    setSubmitting(false)
    if (r.success) { toast('项目创建成功', 'success'); setShowCreate(false); setForm({ name: '', description: '' }); load() }
    else toast(r.message || '创建失败', 'error')
  }

  return (
    <div>
      <PageHeader title="项目管理" subtitle={`共 ${filtered.length} 个项目`} actions={
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, width: isMobile ? '100%' : undefined }}>
          <button onClick={() => { window.open('/api/projects/export', '_blank') }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: isMobile ? '100%' : undefined }}>
            <Download size={14} /> 导出
          </button>
          {canCreate && <Button onClick={() => setShowCreate(true)} style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}><Plus size={16} /> 新建项目</Button>}
        </div>
      } />

      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="搜索项目..."
        filters={[{
          value: statusFilter, onChange: setStatusFilter, placeholder: '全部状态',
          options: statusTabs.filter(t => t.key).map(t => ({ value: t.key, label: t.label })),
        }]}
        resultCount={filtered.length} hasFilters={!!statusFilter || !!search.trim()}
        activeFilterCount={(statusFilter ? 1 : 0) + (search.trim() ? 1 : 0)}
        onClearFilters={() => { setStatusFilter(''); setSearch('') }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title={projects.length === 0 ? '暂无项目' : '无匹配项目'}
          subtitle={projects.length === 0 ? '点击右上角新建项目' : '调整筛选条件试试'}
          action={projects.length === 0 && canCreate ? { label: '新建项目', onClick: () => setShowCreate(true) } : undefined} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
          {filtered.map((p: any) => {
            const st = statusMap[p.status] || statusMap.planning
            return (
              <div key={p.id} style={cardStyle} onClick={() => nav(`/projects/${p.id}`)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: isMobile ? 8 : 12, marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{p.name}</h3>
                  <Badge color={st.color}>{st.label}</Badge>
                </div>
                {(p.internal_client_name || p.client_name) && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(() => {
                      // 根据活跃企业视角动态显示我方/客户
                      const isClientSide = activeEnterpriseId && p.client_id === activeEnterpriseId && p.internal_client_id !== activeEnterpriseId
                      const myName = isClientSide ? (p.client_name || '-') : (p.internal_client_name || '-')
                      const otherName = isClientSide ? (p.internal_client_name || '-') : (p.client_name || '-')
                      return <>
                        <div>我方企业: {myName}</div>
                        <div>客户企业: {otherName}</div>
                      </>
                    })()}
                  </div>
                )}
                {p.description && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap', wordBreak: 'break-word' }}>{p.description}</div>}
                <ProgressBar value={p.progress || 0} />
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>进度 {p.progress || 0}%</div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建项目">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="项目名称 *" placeholder="输入项目名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>项目描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="简要描述项目内容"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>创建后可在项目详情中添加成员、关联应用等</p>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)} style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting} style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
