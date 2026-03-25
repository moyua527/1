import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Trash2, AppWindow, ExternalLink } from 'lucide-react'
import { can } from '../../../stores/permissions'
import Modal from '../../ui/Modal'
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
import TaskTab from './TaskTab'
import MilestoneTab from './MilestoneTab'
import MembersSection from './MembersSection'
import { ManageMembersModal, ManageClientMembersModal, MemberInfoModal, ClientInfoModal } from './ProjectModals'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

export default function ProjectDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useOutletContext<{ user: any }>()
  const role = user?.role || ''
  const canEdit = can(role, 'project:edit')
  const canDelete = can(role, 'project:delete')
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['overview', 'tasks', 'milestones', 'messages', 'app'] as const
  type Tab = typeof validTabs[number]
  const urlTab = searchParams.get('tab') as Tab
  const tab: Tab = validTabs.includes(urlTab as any) ? urlTab! : 'overview'
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true })

  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddClientMember, setShowAddClientMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [clientAvailableUsers, setClientAvailableUsers] = useState<any[]>([])
  const [showAppEdit, setShowAppEdit] = useState(false)
  const [appForm, setAppForm] = useState({ app_name: '', app_url: '' })
  const [clientModal, setClientModal] = useState(false)
  const [clientData, setClientData] = useState<any>(null)

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

  if (!project) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  const st = statusMap[project.status] || statusMap.planning

  const handleDelete = async () => {
    if (!(await confirm({ message: '确定删除此项目？', danger: true }))) return
    const r = await projectApi.remove(id!)
    if (r.success) { toast('项目已删除', 'success'); nav('/projects') }
    else toast(r.message || '删除失败', 'error')
  }

  const refreshAvailableUsers = () => { projectApi.availableUsers(id!).then(r => { if (r.success) setAvailableUsers(r.data || []) }) }
  const refreshClientAvailableUsers = () => { projectApi.clientAvailableUsers(id!).then(r => { if (r.success) setClientAvailableUsers(r.data || []) }) }

  const openManageMembers = () => {
    setShowAddMember(true)
    refreshAvailableUsers()
  }

  const openManageClientMembers = () => {
    setShowAddClientMember(true)
    refreshClientAvailableUsers()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>{project.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Badge color={st.color}>{st.label}</Badge>
            {project.client_name && <span style={{ fontSize: 13, color: '#64748b' }}>企业: <span onClick={() => project.client_id && openClientModal(project.client_id)} style={{ color: '#2563eb', cursor: 'pointer' }}>{project.client_name}</span></span>}
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
            <div><div style={{ fontSize: 13, color: '#64748b' }}>企业</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.client_id ? <span onClick={() => openClientModal(project.client_id)} style={{ color: '#2563eb', cursor: 'pointer' }}>{project.client_name}</span> : (project.client_name || '-')}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>创建时间</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.created_at ? new Date(project.created_at).toLocaleDateString('zh-CN') : '-'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>任务数</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{tasks.length}</div></div>
          </div>
        </div>
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppWindow size={16} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>关联应用</h3>
            </div>
            {canEdit && <button onClick={() => { setAppForm({ app_name: project.app_name || '', app_url: project.app_url || '' }); setShowAppEdit(true) }}
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>{project.app_url ? '编辑' : '添加'}</button>}
          </div>
          {project.app_url ? (
            <a href={project.app_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'linear-gradient(135deg, #eff6ff, #f0f4ff)', borderRadius: 12, border: '1px solid #dbeafe', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.15)'; e.currentTarget.style.borderColor = '#93c5fd' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#dbeafe' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                <AppWindow size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{project.app_name || '应用'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>点击打开应用</div>
              </div>
              <ExternalLink size={18} color="#2563eb" />
            </a>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>暂无关联应用{canEdit ? '，点击"添加"按钮关联' : ''}</div>
          )}
        </div>
        <Modal open={showAppEdit} onClose={() => setShowAppEdit(false)} title={project.app_url ? '编辑关联应用' : '添加关联应用'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="应用名称" placeholder="如：客户门户、货联系统" value={appForm.app_name} onChange={e => setAppForm({ ...appForm, app_name: e.target.value })} />
            <Input label="应用链接" placeholder="https://example.com" value={appForm.app_url} onChange={e => setAppForm({ ...appForm, app_url: e.target.value })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {project.app_url && <Button variant="secondary" onClick={async () => {
                const r = await projectApi.update(id!, { app_name: '', app_url: '' })
                if (r.success) { toast('已移除应用', 'success'); setShowAppEdit(false); loadProject() }
                else toast(r.message || '操作失败', 'error')
              }}>移除应用</Button>}
              <Button onClick={async () => {
                if (!appForm.app_url.trim()) { toast('请输入应用链接', 'error'); return }
                const r = await projectApi.update(id!, appForm)
                if (r.success) { toast('应用已保存', 'success'); setShowAppEdit(false); loadProject() }
                else toast(r.message || '保存失败', 'error')
              }}>保存</Button>
            </div>
          </div>
        </Modal>

        <MembersSection
          project={project}
          canEdit={canEdit}
          onManageMembers={openManageMembers}
          onManageClientMembers={openManageClientMembers}
          onSelectMember={setSelectedMember}
        />

        <ManageMembersModal
          open={showAddMember}
          onClose={() => setShowAddMember(false)}
          projectId={id!}
          members={project.members || []}
          availableUsers={availableUsers}
          onRefresh={loadProject}
          onRefreshAvailable={refreshAvailableUsers}
        />

        <ManageClientMembersModal
          open={showAddClientMember}
          onClose={() => setShowAddClientMember(false)}
          projectId={id!}
          clientMembers={(project.members || []).filter((m: any) => m.source === 'client')}
          clientAvailableUsers={clientAvailableUsers}
          onRefresh={loadProject}
          onRefreshAvailable={refreshClientAvailableUsers}
        />
      </>)}

      {tab === 'tasks' && <TaskTab tasks={tasks} canEdit={canEdit} projectId={id!} loadTasks={loadTasks} />}

      {tab === 'milestones' && <MilestoneTab milestones={milestones} projectId={id!} canEdit={canEdit} onRefresh={loadTasks} />}

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
          <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AppWindow size={32} color="#2563eb" />
            </div>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{project.app_name || '应用'}</h4>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 360 }}>
              外部应用需在独立窗口中打开以确保完整功能体验
            </p>
            <a href={project.app_url} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: 10, fontSize: 15, textDecoration: 'none', fontWeight: 600, marginTop: 8, boxShadow: '0 2px 8px rgba(37,99,235,0.25)', transition: 'transform 0.1s' }}>
              <ExternalLink size={16} /> 打开{project.app_name || '应用'}
            </a>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{project.app_url}</span>
          </div>
        </div>
      )}

      <MemberInfoModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      <ClientInfoModal open={clientModal} onClose={() => setClientModal(false)} clientData={clientData} />
    </div>
  )
}
