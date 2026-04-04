import { useState, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus, FolderKanban, Loader2, Download, Search, Copy, Trash2, RotateCcw } from 'lucide-react'
import { projectApi } from './services/api'
import { can } from '../../stores/permissions'
import { useProjects, useInvalidate } from '../../hooks/useApi'
import useEnterpriseStore from '../../stores/useEnterpriseStore'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'
import PageHeader from '../ui/PageHeader'
import FilterBar from '../ui/FilterBar'
import EmptyState from '../ui/EmptyState'
import useLiveData from '../../hooks/useLiveData'

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
  const [form, setForm] = useState({ name: '', description: '', task_title_presets: [] as string[], newPreset: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinResult, setJoinResult] = useState<any>(null)
  const [joinSearching, setJoinSearching] = useState(false)
  const [joinSubmitting, setJoinSubmitting] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const [trashList, setTrashList] = useState<any[]>([])
  const [trashLoading, setTrashLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const nav = useNavigate()
  const { user, isMobile } = useOutletContext<{ user: any; isMobile?: boolean }>()
  const canCreate = can(user?.role || '', 'project:create')

  const load = useCallback(() => invalidate('projects'), [invalidate])
  useLiveData(['project'], load)

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
    const r = await projectApi.create({ name: form.name.trim(), description: form.description.trim(), task_title_presets: form.task_title_presets })
    setSubmitting(false)
    if (r.success) { toast('项目创建成功', 'success'); setShowCreate(false); setForm({ name: '', description: '', task_title_presets: [], newPreset: '' }); load() }
    else toast(r.message || '创建失败', 'error')
  }

  const handleJoinSearch = async () => {
    if (!joinCode.trim()) { toast('请输入项目ID', 'error'); return }
    setJoinSearching(true); setJoinResult(null)
    const r = await projectApi.searchByCode(joinCode.trim())
    setJoinSearching(false)
    if (r.success) setJoinResult(r.data)
    else toast(r.message || '未找到该项目', 'error')
  }

  const handleJoinSubmit = async () => {
    if (!joinResult) return
    setJoinSubmitting(true)
    const r = await projectApi.joinRequest(joinResult.id, joinMessage)
    setJoinSubmitting(false)
    if (r.success) { toast(r.message || '申请已提交', 'success'); setShowJoin(false); setJoinCode(''); setJoinResult(null); setJoinMessage('') }
    else toast(r.message || '申请失败', 'error')
  }

  return (
    <div>
      <PageHeader title="项目管理" subtitle={`共 ${filtered.length} 个项目`} actions={
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, width: isMobile ? '100%' : undefined }}>
          <button onClick={() => { window.open('/api/projects/export', '_blank') }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: isMobile ? '100%' : undefined }}>
            <Download size={14} /> 导出
          </button>
          <button onClick={async () => { setShowTrash(true); setTrashLoading(true); const r = await projectApi.trash(); setTrashLoading(false); if (r.success) setTrashList(r.data || []); else toast(r.message || '加载失败', 'error') }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: isMobile ? '100%' : undefined }}>
            <Trash2 size={14} /> 回收站
          </button>
          <button onClick={() => { setShowJoin(true); setJoinCode(''); setJoinResult(null); setJoinMessage('') }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--brand)', background: 'var(--bg-selected)', color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: isMobile ? '100%' : undefined }}>
            <Search size={14} /> 通过项目ID加入
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
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{p.name}</h3>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace', cursor: 'pointer' }}
                      title="点击复制项目ID" onClick={e => { e.stopPropagation(); const text = String(p.id); if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text) } else { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) } toast('已复制项目ID', 'success') }}>
                      ID: {p.id} <Copy size={10} style={{ verticalAlign: 'middle' }} />
                    </span>
                  </div>
                  <Badge color={st.color}>{st.label}</Badge>
                </div>
                {(p.internal_client_name || p.client_name) && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(() => {
                      // 根据活跃企业视角动态显示我方/客户
                      const isSameEnterprise = p.internal_client_id && p.client_id && p.internal_client_id === p.client_id
                      const isClientSide = !isSameEnterprise && activeEnterpriseId && p.client_id === activeEnterpriseId && p.internal_client_id !== activeEnterpriseId
                      const myName = isClientSide ? (p.client_name || '-') : (p.internal_client_name || '-')
                      const otherName = isSameEnterprise ? '无' : (isClientSide ? (p.internal_client_name || '无') : (p.client_name || '无'))
                      return <>
                        <div>我方企业: {myName}</div>
                        <div>客户企业: {otherName}</div>
                      </>
                    })()}
                  </div>
                )}
                {p.description && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap', wordBreak: 'break-word' }}>{p.description}</div>}
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
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>固定功能名称</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={form.newPreset} onChange={e => setForm({ ...form, newPreset: e.target.value })} placeholder="输入功能名称" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = form.newPreset.trim(); if (v && !form.task_title_presets.includes(v)) setForm(f => ({ ...f, task_title_presets: [...f.task_title_presets, v], newPreset: '' })) } }} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14 }} />
              <Button variant="secondary" onClick={() => { const v = form.newPreset.trim(); if (v && !form.task_title_presets.includes(v)) setForm(f => ({ ...f, task_title_presets: [...f.task_title_presets, v], newPreset: '' })) }}>添加</Button>
            </div>
            {form.task_title_presets.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{form.task_title_presets.map((p, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-tertiary)', fontSize: 13, color: 'var(--text-body)' }}>{p}<button type="button" onClick={() => setForm(f => ({ ...f, task_title_presets: f.task_title_presets.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>×</button></span>
            ))}</div>}
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>创建任务时可直接从这些固定功能名称中选择</div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>创建后可在项目详情中添加成员、关联应用等</p>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)} style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting} style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="通过项目ID加入">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder="输入项目ID" value={joinCode} onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinSearch()} style={{ flex: 1 }} />
            <Button onClick={handleJoinSearch} disabled={joinSearching} style={{ whiteSpace: 'nowrap' }}>
              {joinSearching ? <Loader2 size={14} className="spin" /> : <Search size={14} />} 搜索
            </Button>
          </div>

          {joinResult && (
            <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{joinResult.name}</h4>
              {joinResult.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>{joinResult.description}</p>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                <span>状态: {statusMap[joinResult.status]?.label || joinResult.status}</span>
                <span>成员: {joinResult.member_count}人</span>
                <span>创建者: {joinResult.creator_name}</span>
              </div>

              {joinResult.is_member ? (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-green)', fontWeight: 500 }}>✓ 你已是该项目成员</p>
              ) : joinResult.has_pending_request ? (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-yellow)', fontWeight: 500 }}>⏳ 你已提交过加入申请，请等待审核</p>
              ) : (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea value={joinMessage} onChange={e => setJoinMessage(e.target.value)} rows={2}
                    placeholder="申请留言（选填）" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
                  <Button onClick={handleJoinSubmit} disabled={joinSubmitting} style={{ alignSelf: 'flex-end' }}>
                    {joinSubmitting ? '提交中...' : '申请加入'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!joinResult && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>输入项目ID后点击搜索，找到项目即可申请加入</p>}
        </div>
      </Modal>

      {/* 项目回收站 */}
      <Modal open={showTrash} onClose={() => setShowTrash(false)} title="项目回收站" width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trashLoading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : trashList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 14 }}>回收站为空</div>
          ) : (<>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>已删除的项目（点击恢复可还原）：</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 350, overflowY: 'auto' }}>
              {trashList.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid transparent' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>ID {p.id}</div>
                  </div>
                  <button disabled={restoringId === p.id} onClick={async () => {
                    setRestoringId(p.id)
                    const r = await projectApi.restore(String(p.id))
                    setRestoringId(null)
                    if (r.success) { toast('项目已恢复', 'success'); setTrashList(prev => prev.filter(x => x.id !== p.id)); load() }
                    else toast(r.message || '恢复失败', 'error')
                  }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)' }}>
                    <RotateCcw size={12} /> {restoringId === p.id ? '恢复中...' : '恢复'}
                  </button>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </Modal>
    </div>
  )
}
