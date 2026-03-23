import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Trash2, User, Mail, Shield, ChevronDown, Plus, X, Upload, FileText, Image, CheckCircle, Circle, Paperclip, Download, AppWindow, ExternalLink, Building2, Phone, MapPin, Clock } from 'lucide-react'
import Modal from '../../ui/Modal'
import Avatar from '../../ui/Avatar'
import { fetchApi } from '../../../bootstrap'
import { projectApi } from '../services/api'
import { taskApi } from '../../task/services/api'
import { milestoneApi } from '../../milestone/services/api'
import Button from '../../ui/Button'
import Badge from '../../ui/Badge'
import Input from '../../ui/Input'
import ProgressBar from '../../ui/ProgressBar'
import MessagePanel from '../../message/components/MessagePanel'
import { confirm } from '../../ui/ConfirmDialog'
import { toast } from '../../ui/Toast'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

const taskStatusMap: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: 'gray' },
  in_progress: { label: '进行中', color: 'yellow' },
  pending_review: { label: '待验收', color: 'blue' },
  accepted: { label: '验收通过', color: 'green' },
}

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }
const sysRoleLabel: Record<string, string> = { admin: '管理员', tech: '技术员', business: '业务员', member: '成员' }

export default function ProjectDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useOutletContext<{ user: any }>()
  const role = user?.role
  const canEdit = ['admin', 'tech', 'business'].includes(role)
  const canDelete = role === 'admin'
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [showMsForm, setShowMsForm] = useState(false)
  const [editingMs, setEditingMs] = useState<any>(null)
  const [msForm, setMsForm] = useState({ title: '', description: '', due_date: '' })
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['overview', 'tasks', 'milestones', 'messages', 'app'] as const
  type Tab = typeof validTabs[number]
  const urlTab = searchParams.get('tab') as Tab
  const tab: Tab = validTabs.includes(urlTab as any) ? urlTab! : 'overview'
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true })

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showDeleteTask, setShowDeleteTask] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [memberRole, setMemberRole] = useState('editor')
  const [memberSearch, setMemberSearch] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' })
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const [deleteSelected, setDeleteSelected] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const openClientModal = (clientId: number) => {
    setClientModal(true)
    setClientData(null)
    fetchApi(`/api/clients/${clientId}`).then(r => { if (r.success) setClientData(r.data) })
  }

  const loadProject = () => {
    if (!id) return
    projectApi.detail(id).then(r => { if (r.success) setProject(r.data) })
  }

  const loadTasks = () => {
    if (!id) return
    taskApi.list(id).then(r => { if (r.success) setTasks(r.data || []) })
    milestoneApi.list(id).then(r => { if (r.success) setMilestones(r.data || []) })
  }

  useEffect(() => {
    if (!id) return
    projectApi.detail(id).then(r => { if (r.success) setProject(r.data) })
    loadTasks()
  }, [id])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!project) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  const st = statusMap[project.status] || statusMap.planning

  const handleDelete = async () => {
    if (!(await confirm({ message: '确定删除此项目？', danger: true }))) return
    const r = await projectApi.remove(id!)
    if (r.success) { toast('项目已删除', 'success'); nav('/projects') }
    else toast(r.message || '删除失败', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>{project.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Badge color={st.color}>{st.label}</Badge>
            {project.client_name && <span style={{ fontSize: 13, color: '#64748b' }}>客户: <span onClick={() => project.client_id && openClientModal(project.client_id)} style={{ color: '#2563eb', cursor: 'pointer' }}>{project.client_name}</span></span>}
          </div>
        </div>
        {canDelete && <Button variant="danger" onClick={handleDelete}><Trash2 size={14} /> 删除</Button>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['overview','概览'],['tasks','任务'],['milestones','里程碑'],['messages','消息'], ...(project.app_url ? [['app', project.app_name || '应用']] : [])] as [string, string][]).map(([k,v]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: tab === k ? '#2563eb' : '#f1f5f9', color: tab === k ? '#fff' : '#64748b',
          }}>{v}</button>
        ))}
      </div>

      {tab === 'overview' && (<>
        <div style={section}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>进度</div>
            <ProgressBar value={project.progress || 0} />
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{project.progress || 0}%</div>
          </div>
          {project.description && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>描述</div><div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{project.description}</div></div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>开始日期</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.start_date || '未设置'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>结束日期</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.end_date || '未设置'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>预算</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.budget > 0 ? `¥${Number(project.budget).toLocaleString()}` : '未设置'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>客户</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.client_id ? <span onClick={() => openClientModal(project.client_id)} style={{ color: '#2563eb', cursor: 'pointer' }}>{project.client_name}</span> : (project.client_name || '-')}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>创建时间</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.created_at ? new Date(project.created_at).toLocaleDateString('zh-CN') : '-'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>任务数</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{tasks.length}</div></div>
          </div>
        </div>
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>项目成员</h3>
            {canEdit && <Button onClick={() => { setShowAddMember(true); setSelectedUserIds(new Set()); setMemberRole('editor'); setMemberSearch(''); projectApi.availableUsers(id!).then(r => { if (r.success) setAvailableUsers(r.data || []) }) }}>管理成员</Button>}
          </div>
          {project.members && project.members.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {project.members.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s' }}
                  onClick={() => setSelectedMember(m)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}>
                  <Avatar name={m.nickname || m.username || '?'} size={32} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{m.nickname || m.username}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.member_role === 'owner' ? '负责人' : m.member_role === 'editor' ? '编辑者' : '查看者'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无成员</div>}
        </div>

        <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="管理项目成员">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {project.members && project.members.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>当前成员</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {project.members.map((m: any) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <Avatar name={m.nickname || m.username || '?'} size={28} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{m.nickname || m.username}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.member_role === 'owner' ? '负责人' : m.member_role === 'editor' ? '编辑者' : '查看者'}</div>
                      </div>
                      {m.member_role !== 'owner' && (
                        <button onClick={async () => { const r = await projectApi.removeMember(id!, String(m.id)); if (r.success) { toast('已移除', 'success'); loadProject(); projectApi.availableUsers(id!).then(r => { if (r.success) setAvailableUsers(r.data || []) }) } else toast(r.message || '移除失败', 'error') }}
                          style={{ padding: '4px 12px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>移除</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>添加新成员</label>
              <Input placeholder="输入用户名或昵称筛选" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 8 }}>
                {availableUsers.filter(u => { if (!memberSearch) return true; const s = memberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.username || '').toLowerCase().includes(s) || (sysRoleLabel[u.role] || '').includes(s) }).map((u: any) => {
                  const checked = selectedUserIds.has(u.id)
                  return (
                  <div key={u.id} onClick={() => setSelectedUserIds(prev => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
                      background: checked ? '#eff6ff' : 'transparent',
                      borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent' }}>
                    <input type="checkbox" checked={checked} readOnly style={{ accentColor: '#2563eb', width: 16, height: 16, cursor: 'pointer' }} />
                    <Avatar name={u.nickname || u.username || '?'} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{u.nickname || u.username}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>@{u.username} · {sysRoleLabel[u.role] || u.role}</div>
                    </div>
                  </div>
                  )
                })}
                {availableUsers.filter(u => { if (!memberSearch) return true; const s = memberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.username || '').toLowerCase().includes(s) || (sysRoleLabel[u.role] || '').includes(s) }).length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>无可添加的用户</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
                  <option value="editor">编辑者</option>
                  <option value="viewer">查看者</option>
                </select>
                {selectedUserIds.size > 0 && <span style={{ fontSize: 12, color: '#64748b' }}>已选 {selectedUserIds.size} 人</span>}
                <Button disabled={selectedUserIds.size === 0 || submitting} onClick={async () => {
                  setSubmitting(true)
                  let ok = 0
                  for (const uid of selectedUserIds) {
                    const r = await projectApi.addMember(id!, { user_id: uid, role: memberRole })
                    if (r.success) ok++
                  }
                  setSubmitting(false)
                  if (ok > 0) { toast(`已添加 ${ok} 名成员`, 'success'); setSelectedUserIds(new Set()); loadProject(); projectApi.availableUsers(id!).then(r => { if (r.success) setAvailableUsers(r.data || []) }) }
                  else toast('添加失败', 'error')
                }}>{submitting ? '添加中...' : `添加${selectedUserIds.size > 0 ? ` (${selectedUserIds.size})` : ''}`}</Button>
              </div>
            </div>
          </div>
        </Modal>
      </>)}

      {tab === 'tasks' && (<>
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>任务列表</h3>
            {canEdit && <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              }}>操作 <ChevronDown size={14} /></button>
              {dropdownOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', minWidth: 120, zIndex: 10, overflow: 'hidden' }}>
                  <button onClick={() => { setDropdownOpen(false); setShowCreateTask(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#334155' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Plus size={14} color="#2563eb" /> 添加任务
                  </button>
                  <button onClick={() => { setDropdownOpen(false); setDeleteSelected(new Set()); setShowDeleteTask(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc2626' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Trash2 size={14} /> 删除任务
                  </button>
                </div>
              )}
            </div>}
          </div>
          {tasks.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无任务</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map((t: any) => {
                const ts = taskStatusMap[t.status] || taskStatusMap.todo
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{t.description}</div>}
                      {t.due_date && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>截止: {t.due_date}</div>}
                      {t.attachments && t.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {t.attachments.map((a: any) => (
                            <a key={a.id} href={`/api/tasks/attachments/${a.id}/download`} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#eff6ff', borderRadius: 6, fontSize: 12, color: '#2563eb', textDecoration: 'none', border: '1px solid #dbeafe' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }} onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff' }}>
                              {a.mime_type?.startsWith('image/') ? <Image size={12} /> : <Paperclip size={12} />}
                              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.original_name}</span>
                              <Download size={10} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <select value={t.status} disabled={!canEdit} onChange={async (e) => {
                      await taskApi.move(String(t.id), e.target.value)
                      loadTasks()
                    }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.6 }}>
                      <option value="todo">待办</option>
                      <option value="in_progress">进行中</option>
                      <option value="pending_review">待验收</option>
                      <option value="accepted">验收通过</option>
                    </select>
                    <Badge color={ts.color}>{ts.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 创建任务弹窗 */}
        <Modal open={showCreateTask} onClose={() => { setShowCreateTask(false); setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' }); setTaskFiles([]) }} title="添加任务">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="任务标题" placeholder="输入任务标题" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>任务描述</label>
              <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="描述任务内容..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }} />
            </div>
            <Input label="截止日期" type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>优先级</label>
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>附件（文件/图片）</label>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => {
                if (e.target.files) setTaskFiles(prev => [...prev, ...Array.from(e.target.files!)])
                if (fileInputRef.current) fileInputRef.current.value = ''
              }} />
              <button onClick={() => fileInputRef.current?.click()} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                border: '1px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#64748b', width: '100%', justifyContent: 'center',
              }}><Upload size={14} /> 点击选择文件、图片</button>
              {taskFiles.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {taskFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: '#f1f5f9', borderRadius: 6, fontSize: 13 }}>
                      {f.type.startsWith('image/') ? <Image size={14} color="#2563eb" /> : <FileText size={14} color="#64748b" />}
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }}>{f.name}</span>
                      <button onClick={() => setTaskFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => { setShowCreateTask(false); setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' }); setTaskFiles([]) }}>取消</Button>
              <Button disabled={submitting} onClick={async () => {
                if (!taskForm.title.trim()) { toast('请输入任务标题', 'error'); return }
                setSubmitting(true)
                const r = await taskApi.create({ project_id: Number(id), title: taskForm.title, description: taskForm.description, due_date: taskForm.due_date || undefined, priority: taskForm.priority }, taskFiles.length > 0 ? taskFiles : undefined)
                if (r.success) {
                  toast('任务创建成功', 'success')
                  setShowCreateTask(false)
                  setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' })
                  setTaskFiles([])
                  loadTasks()
                } else toast(r.message || '创建失败', 'error')
                setSubmitting(false)
              }}>{submitting ? '创建中...' : '创建'}</Button>
            </div>
          </div>
        </Modal>

        {/* 删除任务弹窗 */}
        <Modal open={showDeleteTask} onClose={() => setShowDeleteTask(false)} title="删除任务">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasks.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 20 }}>暂无任务可删除</div> : (<>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>选择要删除的任务：</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                {tasks.map((t: any) => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: deleteSelected.has(t.id) ? '#fef2f2' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: deleteSelected.has(t.id) ? '1px solid #fca5a5' : '1px solid transparent' }}>
                    <input type="checkbox" checked={deleteSelected.has(t.id)} onChange={() => {
                      setDeleteSelected(prev => { const n = new Set(prev); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n })
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{t.title}</div>
                      {t.due_date && <div style={{ fontSize: 12, color: '#94a3b8' }}>截止: {t.due_date}</div>}
                    </div>
                    <Badge color={(taskStatusMap[t.status] || taskStatusMap.todo).color}>{(taskStatusMap[t.status] || taskStatusMap.todo).label}</Badge>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>已选 {deleteSelected.size} 项</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" onClick={() => setShowDeleteTask(false)}>取消</Button>
                  <Button variant="danger" disabled={deleteSelected.size === 0 || submitting} onClick={async () => {
                    setSubmitting(true)
                    for (const tid of deleteSelected) await taskApi.remove(String(tid))
                    toast(`已删除 ${deleteSelected.size} 个任务`, 'success')
                    setShowDeleteTask(false)
                    setDeleteSelected(new Set())
                    loadTasks()
                    setSubmitting(false)
                  }}>{submitting ? '删除中...' : `删除 (${deleteSelected.size})`}</Button>
                </div>
              </div>
            </>)}
          </div>
        </Modal>
      </>)}
      {tab === 'milestones' && (
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>里程碑</h3>
            {canEdit && <Button onClick={() => { setEditingMs(null); setMsForm({ title: '', description: '', due_date: '' }); setShowMsForm(!showMsForm) }}><Plus size={14} /> 新增</Button>}
          </div>
          {showMsForm && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>标题</label>
                  <input value={msForm.title} onChange={e => setMsForm({ ...msForm, title: e.target.value })} placeholder="里程碑标题"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>截止日期</label>
                  <input type="date" value={msForm.due_date} onChange={e => setMsForm({ ...msForm, due_date: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <textarea value={msForm.description} onChange={e => setMsForm({ ...msForm, description: e.target.value })}
                placeholder="描述（可选）" rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="secondary" onClick={() => { setShowMsForm(false); setEditingMs(null) }}>取消</Button>
                <Button onClick={async () => {
                  if (!msForm.title.trim()) { toast('请输入标题', 'error'); return }
                  const r = editingMs
                    ? await milestoneApi.update(String(editingMs.id), msForm)
                    : await milestoneApi.create({ project_id: Number(id), ...msForm })
                  if (r.success) { toast(editingMs ? '里程碑已更新' : '里程碑已创建', 'success'); setShowMsForm(false); setEditingMs(null); setMsForm({ title: '', description: '', due_date: '' }); loadTasks() }
                  else toast(r.message || '操作失败', 'error')
                }}>{editingMs ? '保存修改' : '创建'}</Button>
              </div>
            </div>
          )}
          {milestones.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无里程碑</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {milestones.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ cursor: canEdit ? 'pointer' : 'default' }}
                    onClick={canEdit ? async () => { await milestoneApi.toggle(String(m.id)); loadTasks() } : undefined}>
                    {m.is_completed ? <CheckCircle size={20} color="#16a34a" /> : <Circle size={20} color="#94a3b8" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: m.is_completed ? '#94a3b8' : '#0f172a', textDecoration: m.is_completed ? 'line-through' : 'none' }}>{m.title}</div>
                    {m.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.description}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      {m.due_date && <span style={{ fontSize: 11, color: new Date(m.due_date) < new Date() && !m.is_completed ? '#dc2626' : '#94a3b8' }}>截止: {m.due_date.slice(0, 10)}</span>}
                      {m.completed_at && <span style={{ fontSize: 11, color: '#16a34a' }}>已完成</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditingMs(m); setMsForm({ title: m.title || '', description: m.description || '', due_date: m.due_date ? m.due_date.slice(0, 10) : '' }); setShowMsForm(true) }}
                        style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>编辑</button>
                      <button onClick={async () => { const r = await milestoneApi.remove(String(m.id)); if (r.success) { toast('已删除', 'success'); loadTasks() } else toast(r.message || '删除失败', 'error') }}
                        style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>删除</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === 'messages' && <div style={section}><MessagePanel projectId={id!} /></div>}

      {tab === 'app' && project.app_url && (
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AppWindow size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{project.app_name || '应用'}</h3>
            </div>
            <a href={project.app_url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>
              <ExternalLink size={14} /> 新窗口打开
            </a>
          </div>
          {(() => {
            try { const u = new URL(project.app_url); if (u.origin === window.location.origin) return (
              <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
                <AppWindow size={32} color="#94a3b8" />
                <div style={{ fontSize: 14, color: '#64748b' }}>同域应用无法在iframe中嵌入，请使用新窗口打开</div>
                <a href={project.app_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
                  <ExternalLink size={14} /> 新窗口打开
                </a>
              </div>
            )} catch {}
            return (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
                <iframe src={project.app_url} style={{ width: '100%', height: 'calc(100vh - 260px)', border: 'none', display: 'block' }}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  title={project.app_name || '应用'} />
              </div>
            )
          })()}
        </div>
      )}

      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="成员信息">
        {selectedMember && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
            <Avatar name={selectedMember.nickname || selectedMember.username || '?'} size={64} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{selectedMember.nickname || selectedMember.username}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>@{selectedMember.username}</div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={16} color="#64748b" />
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>用户名</span>
                <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{selectedMember.username}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="#64748b" />
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>项目角色</span>
                <Badge color={selectedMember.member_role === 'owner' ? 'blue' : selectedMember.member_role === 'editor' ? 'green' : 'gray'}>
                  {selectedMember.member_role === 'owner' ? '负责人' : selectedMember.member_role === 'editor' ? '编辑者' : '查看者'}
                </Badge>
              </div>
              {selectedMember.nickname && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color="#64748b" />
                  <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>昵称</span>
                  <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{selectedMember.nickname}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={clientModal} onClose={() => setClientModal(false)} title="客户信息">
        {!clientData ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>加载中...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{clientData.name}</div>
                {clientData.company && <div style={{ fontSize: 13, color: '#64748b' }}>{clientData.company}</div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {clientData.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={15} color="#64748b" /><span style={{ fontSize: 14, color: '#334155' }}>{clientData.email}</span></div>}
              {clientData.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={15} color="#64748b" /><span style={{ fontSize: 14, color: '#334155' }}>{clientData.phone}</span></div>}
              {clientData.address && <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2' }}><MapPin size={15} color="#64748b" /><span style={{ fontSize: 14, color: '#334155' }}>{clientData.address}</span></div>}
            </div>
            {clientData.notes && <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>备注</div><div style={{ fontSize: 14, color: '#334155' }}>{clientData.notes}</div></div>}
            {clientData.members && clientData.members.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>企业成员</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {clientData.members.map((m: any) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
                      <Avatar name={m.name} size={28} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                      {m.position && <span style={{ fontSize: 12, color: '#64748b' }}>{m.position}</span>}
                      {m.phone && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{m.phone}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
