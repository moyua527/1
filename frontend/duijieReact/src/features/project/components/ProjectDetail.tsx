import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Trash2, AppWindow, ExternalLink, MoreVertical, Pencil } from 'lucide-react'
import { can } from '../../../stores/permissions'
import useProjectPerms from '../../../hooks/useProjectPerms'
import Modal from '../../ui/Modal'
import { fetchApi } from '../../../bootstrap'
import { projectApi } from '../services/api'
import { taskApi } from '../../task/services/api'
import { milestoneApi } from '../../milestone/services/api'
import Button from '../../ui/Button'
import Badge from '../../ui/Badge'
import Input from '../../ui/Input'
import MessagePanel from '../../message/components/MessagePanel'
import { confirm } from '../../ui/ConfirmDialog'
import { toast } from '../../ui/Toast'
import TaskTab from './TaskTab'
import MilestoneTab from './MilestoneTab'
import MembersSection from './MembersSection'
import { ManageMembersModal, ManageClientMembersModal, MemberInfoModal, ClientInfoModal } from './ProjectModals'
import useLiveData from '../../../hooks/useLiveData'
import { onSocket } from '../../ui/smartSocket'
import { formatDateTime } from '../../../utils/datetime'
import EditProjectModal from './EditProjectModal'
import SetClientModal from './SetClientModal'
import JoinRequestsTab from './JoinRequestsTab'
import AppTab from './AppTab'
import ProjectRoleList from './ProjectRoleList'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

const TASK_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: '#94a3b8' },
  submitted: { label: '已提出', color: '#3b82f6' },
  disputed: { label: '待补充', color: '#eab308' },
  in_progress: { label: '执行中', color: '#a855f7' },
  pending_review: { label: '待验收', color: '#f97316' },
  review_failed: { label: '验收不通过', color: '#ef4444' },
  accepted: { label: '验收通过', color: '#22c55e' },
}

function TaskDistribution({ tasks }: { tasks: any[] }) {
  const counts: Record<string, number> = {}
  for (const t of tasks) {
    const s = t.status || 'todo'
    counts[s] = (counts[s] || 0) + 1
  }
  const total = tasks.length
  if (total === 0) return null

  const entries = Object.entries(TASK_STATUS_CONFIG).filter(([k]) => (counts[k] || 0) > 0)

  return (
    <div style={section}>
      <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>需求状态分布</h3>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 14, background: 'var(--bg-tertiary)' }}>
        {entries.map(([key, cfg]) => (
          <div key={key} style={{ width: `${((counts[key] || 0) / total) * 100}%`, background: cfg.color, transition: 'width 0.3s ease' }}
            title={`${cfg.label}: ${counts[key]}`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        {entries.map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{counts[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  task_created: { icon: '📋', color: '#3b82f6', bg: '#eff6ff' },
  milestone_created: { icon: '🚩', color: '#f97316', bg: '#fff7ed' },
  milestone_completed: { icon: '✅', color: '#22c55e', bg: '#f0fdf4' },
  member_joined: { icon: '👤', color: '#a855f7', bg: '#faf5ff' },
}

function ActivityFeed({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    projectApi.getActivity(projectId, 15).then(r => {
      if (r.success) setItems(r.data || [])
    }).finally(() => setLoading(false))
  }, [projectId])

  const fmtTime = (ts: string) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return '刚刚'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const descOf = (item: any) => {
    const actor = item.actor_name || item.actor_username || '未知用户'
    switch (item.type) {
      case 'task_created': return <><b>{actor}</b> 创建了需求 <b>{item.title}</b></>
      case 'milestone_created': return <><b>{actor}</b> 创建了里程碑 <b>{item.title}</b></>
      case 'milestone_completed': return <>里程碑 <b>{item.title}</b> 已完成</>
      case 'member_joined': return <><b>{item.title}</b> 加入了项目</>
      default: return <>{item.title}</>
    }
  }

  if (loading) return <div style={{ ...section, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: 24 }}>加载动态中...</div>

  return (
    <div style={section}>
      <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>最近动态</h3>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: 16 }}>暂无动态</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {items.map((item, i) => {
            const cfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.task_created
            return (
              <div key={`${item.type}-${item.entity_id}-${i}`} style={{ display: 'flex', gap: 12, position: 'relative', paddingLeft: 28, paddingBottom: i < items.length - 1 ? 16 : 0, minHeight: 36 }}>
                {i < items.length - 1 && <div style={{ position: 'absolute', left: 13, top: 28, bottom: 0, width: 2, background: 'var(--border-primary)' }} />}
                <div style={{ position: 'absolute', left: 2, top: 2, width: 24, height: 24, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, zIndex: 1 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>{descOf(item)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{fmtTime(item.happened_at)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

const PROJECT_DETAIL_TIMEOUT_MS = 8000

export default function ProjectDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user, isMobile } = useOutletContext<{ user: any; isMobile?: boolean }>()
  const role = user?.role || ''
  const platformCanEdit = can(role, 'project:edit')
  const platformCanDelete = can(role, 'project:delete')
  const { perms: projectPerms } = useProjectPerms(id)
  const isAdmin = role === 'admin'
  const canEdit = isAdmin || platformCanEdit || !!projectPerms?.can_edit_project_name || !!projectPerms?.can_edit_project_desc || !!projectPerms?.can_edit_project_status
  const canDelete = isAdmin || platformCanDelete || !!projectPerms?.can_delete_project
  const canAddMember = isAdmin || !!projectPerms?.can_add_member
  const canApproveJoin = isAdmin || !!projectPerms?.can_approve_join
  const canManageMilestone = isAdmin || !!projectPerms?.can_create_milestone || !!projectPerms?.can_edit_milestone || !!projectPerms?.can_delete_milestone || !!projectPerms?.can_toggle_milestone
  const canCreateTask = isAdmin || !!projectPerms?.can_create_task
  const canManageRole = isAdmin || !!projectPerms?.can_create_role || !!projectPerms?.can_edit_role_name || !!projectPerms?.can_delete_role
  const [project, setProject] = useState<any>(null)
  const projectRef = useRef<any>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['overview', 'tasks', 'milestones', 'messages', 'app', 'roles', 'join_requests'] as const
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
  const [projectRoles, setProjectRoles] = useState<any[]>([])
  const [showSetClient, setShowSetClient] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [pendingJoinCount, setPendingJoinCount] = useState(0)

  const _openClientModal = (clientId: number) => {
    setClientModal(true)
    setClientData(null)
    fetchApi(`/api/clients/${clientId}`).then(r => { if (r.success) setClientData(r.data) })
  }
  void _openClientModal

  const loadProject = useCallback(async () => {
    if (!id) return
    setProjectError('')

    let message = '项目加载失败，请稍后重试'
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const r = await Promise.race([
          projectApi.detail(id),
          new Promise<any>(resolve => setTimeout(() => resolve({ success: false, status: 408, message: '项目加载超时，请重试' }), PROJECT_DETAIL_TIMEOUT_MS)),
        ])
        if (r.success && r.data) {
          projectRef.current = r.data
          setProject(r.data)
          setProjectError('')
          setProjectLoading(false)
          return
        }

        message = r.message || (r.status === 404 ? '项目不存在' : r.status === 403 ? '无权访问此项目' : '项目加载失败，请稍后重试')
        if (r.status === 401 || r.status === 403 || r.status === 404) break
      } catch {
        message = '项目加载失败，请稍后重试'
      }

      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 400))
      }
    }

    if (!projectRef.current) {
      setProject(null)
      setProjectError(message)
    }
    setProjectLoading(false)
  }, [id])

  useLiveData(['project'], loadProject)

  const loadPendingJoinCount = useCallback(() => {
    if (!id) return
    projectApi.getJoinRequests(id).then(r => {
      if (r.success) setPendingJoinCount((r.data || []).filter((req: any) => req.status === 'pending').length)
    })
  }, [id])

  const loadTasks = useCallback(() => {
    if (!id) return
    taskApi.list(id).then(r => { if (r.success) setTasks(r.data || []) })
    milestoneApi.list(id).then(r => { if (r.success) setMilestones(r.data || []) })
  }, [id])

  useEffect(() => {
    if (!id) return
    const off = onSocket('data_changed', (payload: any) => {
      if (payload?.entity !== 'task') return
      if (payload?.project_id && String(payload.project_id) !== String(id)) return
      loadTasks()
    })
    return off
  }, [id, loadTasks])

  useEffect(() => {
    if (!id) return
    const timer = window.setTimeout(() => {
      loadProject()
      loadTasks()
      loadPendingJoinCount()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id, loadProject, loadTasks, loadPendingJoinCount])

  if (projectLoading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>
  if (projectError) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div>{projectError}</div>
      <Button variant="secondary" onClick={() => loadProject()}>重试</Button>
    </div>
  )
  if (!project) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>项目不存在</div>

  const st = statusMap[project.status] || statusMap.planning
  const isOwner = (project.members || []).some((m: any) => m.user_id === user?.id && m.role === 'owner')
  const allMembers = project.members || []

  const handleDelete = async () => {
    if (!(await confirm({ message: '确定将此项目移到回收站？可在项目列表的回收站中恢复。', danger: true }))) return
    const r = await projectApi.remove(id!)
    if (r.success) { toast('项目已移至回收站', 'success'); nav('/projects') }
    else toast(r.message || '删除失败', 'error')
  }

  const refreshAvailableUsers = () => { projectApi.availableUsers(id!).then(r => { if (r.success) setAvailableUsers(r.data || []) }) }
  const refreshClientAvailableUsers = () => { projectApi.clientAvailableUsers(id!).then(r => { if (r.success) setClientAvailableUsers(r.data || []) }) }

  const loadProjectRoles = () => {
    projectApi.listRoles(id!).then(r => { if (r.success) setProjectRoles(r.data || []) }).catch(() => {})
  }

  const openManageMembers = () => {
    setShowAddMember(true)
    refreshAvailableUsers()
    loadProjectRoles()
  }

  const _openManageClientMembers = () => {
    setShowAddClientMember(true)
    refreshClientAvailableUsers()
  }
  void _openManageClientMembers

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 48px)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>{project.name}</h1>
            {project.join_code && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace', padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: 4, cursor: 'pointer', userSelect: 'none' }}
              title="点击复制项目 ID"
              onClick={() => { const text = project.join_code; if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text) } else { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) } toast('项目 ID 已复制', 'success') }}>
              ID: {project.join_code}
            </span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <Badge color={st.color}>{st.label}</Badge>
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowActionMenu(v => !v)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 8, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><MoreVertical size={18} /></button>
            {showActionMenu && <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowActionMenu(false)} />
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 140, overflow: 'hidden' }}>
                {canEdit && <button onClick={() => { setShowActionMenu(false); setShowEditProject(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-body)', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Pencil size={14} /> 编辑项目</button>}
                {canDelete && <button onClick={() => { setShowActionMenu(false); handleDelete() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Trash2 size={14} /> 删除项目</button>}
              </div>
            </>}
          </div>
        )}
      </div>
      <EditProjectModal open={showEditProject} project={project} onClose={() => setShowEditProject(false)}
        onSave={async (data) => {
          const r = await projectApi.update(id!, data)
          if (r.success) { toast('已更新', 'success'); loadProject(); return true }
          toast(r.message || '更新失败', 'error'); return false
        }} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 0, flexShrink: 0, ...(isMobile ? { overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } : { flexWrap: 'wrap' }) } as any}>
        {([['overview','概览'],['tasks','需求'],['milestones','里程碑'],['messages','消息'], ...(project.app_url ? [['app', project.app_name || '应用']] : []), ...((isOwner || canManageRole) ? [['roles', '角色管理']] : []), ...(canApproveJoin ? [['join_requests', '加入申请']] : [])] as [string, string][]).map(([k,v]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, position: 'relative', whiteSpace: 'nowrap', flexShrink: 0,
            background: tab === k ? 'var(--brand)' : 'var(--bg-tertiary)', color: tab === k ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}>
            {v}
            {k === 'tasks' && tasks.filter(t => t.status === 'submitted').length > 0 && tab !== 'tasks' && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            )}
            {k === 'join_requests' && pendingJoinCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', lineHeight: 1 }}>
                {pendingJoinCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, paddingTop: 16, ...(tab === 'tasks' ? { display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } : { overflowY: 'auto' as const }) }}>
      {tab === 'overview' && (<>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* 左栏：项目详情 + 关联应用 */}
          <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined }}>
            <div style={section}>
              {project.description && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>描述</div><div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>{project.description}</div></div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>开始日期</div>
                  {canEdit ? (
                    <input type="date" value={project.start_date ? project.start_date.slice(0, 10) : ''} onChange={async e => {
                      const r = await projectApi.update(id!, { start_date: e.target.value || null })
                      if (r.success) { toast('已更新', 'success'); loadProject() } else toast(r.message || '更新失败', 'error')
                    }} style={{ fontSize: 14, fontWeight: 500, marginTop: 2, border: '1px solid var(--border-primary)', borderRadius: 6, padding: '4px 8px', background: 'var(--bg-primary)', color: 'var(--text-heading)', cursor: 'pointer', width: '100%' }} />
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.start_date ? project.start_date.slice(0, 10) : '未设置'}</div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>结束日期</div>
                  {canEdit ? (
                    <input type="date" value={project.end_date ? project.end_date.slice(0, 10) : ''} onChange={async e => {
                      const r = await projectApi.update(id!, { end_date: e.target.value || null })
                      if (r.success) { toast('已更新', 'success'); loadProject() } else toast(r.message || '更新失败', 'error')
                    }} style={{ fontSize: 14, fontWeight: 500, marginTop: 2, border: '1px solid var(--border-primary)', borderRadius: 6, padding: '4px 8px', background: 'var(--bg-primary)', color: 'var(--text-heading)', cursor: 'pointer', width: '100%' }} />
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.end_date ? project.end_date.slice(0, 10) : '未设置'}</div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>预算</div>
                  {canEdit ? (
                    <input type="number" placeholder="输入预算金额" defaultValue={project.budget > 0 ? project.budget : ''} onBlur={async e => {
                      const val = e.target.value ? Number(e.target.value) : 0
                      if (val === (project.budget || 0)) return
                      const r = await projectApi.update(id!, { budget: val })
                      if (r.success) { toast('已更新', 'success'); loadProject() } else toast(r.message || '更新失败', 'error')
                    }} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    style={{ fontSize: 14, fontWeight: 500, marginTop: 2, border: '1px solid var(--border-primary)', borderRadius: 6, padding: '4px 8px', background: 'var(--bg-primary)', color: 'var(--text-heading)', width: '100%' }} />
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.budget > 0 ? `¥${Number(project.budget).toLocaleString()}` : '未设置'}</div>
                  )}
                </div>
                <div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>创建者</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.creator_name || project.creator_username || '—'}</div></div>
                <div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>创建时间</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{formatDateTime(project.created_at)}</div></div>
                <div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>最后更新</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{formatDateTime(project.updated_at)}</div></div>
                <div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>需求数</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{tasks.length}</div></div>
              </div>
            </div>

            <TaskDistribution tasks={tasks} />

            <ActivityFeed projectId={id!} />

            <div style={section}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AppWindow size={16} color="var(--brand)" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>关联应用</h3>
                </div>
                {canEdit && <button onClick={() => { setAppForm({ app_name: project.app_name || '', app_url: project.app_url || '' }); setShowAppEdit(true) }}
                  style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>{project.app_url ? '编辑' : '添加'}</button>}
              </div>
              {project.app_url && /^https?:\/\/.+/.test(project.app_url) ? (
                <a href={project.app_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'linear-gradient(135deg, #eff6ff, #f0f4ff)', borderRadius: 12, border: '1px solid #dbeafe', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.15)'; e.currentTarget.style.borderColor = '#93c5fd' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--brand-light-2)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                    <AppWindow size={22} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{project.app_name || '应用'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>点击打开应用</div>
                  </div>
                  <ExternalLink size={18} color="var(--brand)" />
                </a>
              ) : project.app_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AppWindow size={22} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#dc2626' }}>{project.app_name || '应用'}</div>
                    <div style={{ fontSize: 12, color: '#ef4444' }}>应用链接无效，请编辑修正（需以 http:// 或 https:// 开头）</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无关联应用{canEdit ? '，点击"添加"按钮关联' : ''}</div>
              )}
            </div>
          </div>

          {/* 右栏：项目成员 */}
          <div style={{ ...section, width: isMobile ? '100%' : 220, flexShrink: 0, marginBottom: 0, position: isMobile ? 'static' : 'sticky', top: 0 }}>
            <MembersSection
              projectId={id!}
              myMembers={allMembers}
              canEditMyTeam={canAddMember || isOwner}
              onManageMyMembers={openManageMembers}
              onSelectMember={setSelectedMember}
              onRefresh={loadProject}
            />
          </div>
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
                if (!/^https?:\/\/.+/.test(appForm.app_url.trim())) { toast('应用链接必须以 http:// 或 https:// 开头', 'error'); return }
                const r = await projectApi.update(id!, appForm)
                if (r.success) { toast('应用已保存', 'success'); setShowAppEdit(false); loadProject() }
                else toast(r.message || '保存失败', 'error')
              }}>保存</Button>
            </div>
          </div>
        </Modal>

        <ManageMembersModal
          open={showAddMember}
          onClose={() => setShowAddMember(false)}
          projectId={id!}
          members={allMembers}
          availableUsers={availableUsers}
          projectRoles={projectRoles}
          onRefresh={loadProject}
          onRefreshAvailable={refreshAvailableUsers}
          onGoToRoles={(isOwner || canManageRole) ? () => setTab('roles') : undefined}
        />

        <ManageClientMembersModal
          open={showAddClientMember}
          onClose={() => setShowAddClientMember(false)}
          projectId={id!}
          clientMembers={[]}
          clientAvailableUsers={clientAvailableUsers}
          onRefresh={loadProject}
          onRefreshAvailable={refreshClientAvailableUsers}
        />

      </>)}

      {tab === 'tasks' && <TaskTab tasks={tasks} canEdit={canCreateTask} projectId={id!} loadTasks={loadTasks} />}

      {tab === 'milestones' && <MilestoneTab milestones={milestones} projectId={id!} canEdit={canManageMilestone} onRefresh={loadTasks} />}

      {tab === 'messages' && <div style={section}><MessagePanel projectId={id!} /></div>}

      {tab === 'app' && <AppTab project={project} />}

      {tab === 'roles' && <ProjectRoleList canEdit={isOwner || canManageRole} projectId={id!} />}

      {tab === 'join_requests' && <JoinRequestsTab projectId={id!} joinCode={project.join_code} onRefresh={() => { loadProject(); loadPendingJoinCount() }} />}


      <SetClientModal open={showSetClient} hasExternalEnterprise={false}
        onClose={() => setShowSetClient(false)}
        onSendRequest={async (clientId) => {
          const r = await projectApi.sendClientRequest(id!, { to_enterprise_id: clientId })
          if (r.success) { toast('关联请求已发送，等待对方审批', 'success'); return true }
          toast(r.message || '发送失败', 'error'); return false
        }}
        onRemoveClient={async () => {
          const r = await projectApi.update(id!, { client_id: null })
          if (r.success) { toast('已取消关联', 'success'); loadProject(); return true }
          toast(r.message || '操作失败', 'error'); return false
        }} />

      <MemberInfoModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      <ClientInfoModal open={clientModal} onClose={() => setClientModal(false)} clientData={clientData} />
      </div>
    </div>
  )
}
