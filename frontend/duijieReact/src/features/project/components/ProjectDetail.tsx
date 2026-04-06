import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import useProjectTabStore from '../../../stores/useProjectTabStore'
import { can } from '../../../stores/permissions'
import useProjectPerms from '../../../hooks/useProjectPerms'
import { fetchApi } from '../../../bootstrap'
import { projectApi } from '../services/api'
import { taskApi } from '../../task/services/api'
import { milestoneApi } from '../../milestone/services/api'
import Button from '../../ui/Button'
import Badge from '../../ui/Badge'
import { confirm } from '../../ui/ConfirmDialog'
import { toast } from '../../ui/Toast'
import TaskTab from './TaskTab'
import MilestoneTab from './MilestoneTab'
import ProjectFileTab from './ProjectFileTab'
import ProjectSettingsTab from './ProjectSettingsTab'
import MessagePanel from '../../message/components/MessagePanel'
import { ManageMembersModal, ManageClientMembersModal, MemberInfoModal, ClientInfoModal } from './ProjectModals'
import useLiveData from '../../../hooks/useLiveData'
import { onSocket } from '../../ui/smartSocket'
import EditProjectModal from './EditProjectModal'
import SetClientModal from './SetClientModal'
import ProjectGuide from '../../ui/ProjectGuide'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}



const PROJECT_DETAIL_TIMEOUT_MS = 8000

const _projectCache = new Map<string, { project: any; tasks: any[]; milestones: any[]; ts: number }>()

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
  const canApproveJoin = isAdmin || !!projectPerms?.can_approve_join
  const canManageMilestone = isAdmin || !!projectPerms?.can_create_milestone || !!projectPerms?.can_edit_milestone || !!projectPerms?.can_delete_milestone || !!projectPerms?.can_toggle_milestone
  const canCreateTask = isAdmin || !!projectPerms?.can_create_task
  const canManageRole = isAdmin || !!projectPerms?.can_create_role || !!projectPerms?.can_edit_role_name || !!projectPerms?.can_delete_role
  const cached = id ? _projectCache.get(id) : undefined
  const [project, setProject] = useState<any>(cached?.project ?? null)
  const projectRef = useRef<any>(cached?.project ?? null)
  const [projectLoading, setProjectLoading] = useState(!cached)
  const [projectError, setProjectError] = useState('')
  const [tasks, setTasks] = useState<any[]>(cached?.tasks ?? [])
  const [milestones, setMilestones] = useState<any[]>(cached?.milestones ?? [])
  const [hasNewSubmitted, setHasNewSubmitted] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['tasks', 'files', 'milestones', 'messages', 'settings'] as const
  type Tab = typeof validTabs[number]
  const urlTab = searchParams.get('tab') as Tab
  const tab: Tab = validTabs.includes(urlTab as any) ? urlTab! : 'tasks'
  const setTab = (t: Tab) => {
    setSearchParams({ tab: t }, { replace: true })
    if (t === 'tasks') {
      localStorage.setItem(`task_view_${user?.id}_${id}`, new Date().toISOString())
      setHasNewSubmitted(false)
    }
  }

  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddClientMember, setShowAddClientMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [clientAvailableUsers, setClientAvailableUsers] = useState<any[]>([])
  const [clientModal, setClientModal] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const [projectRoles] = useState<any[]>([])
  const [showSetClient, setShowSetClient] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [pendingJoinCount, setPendingJoinCount] = useState(0)
  const [showProjectGuide, setShowProjectGuide] = useState(false)

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
          const prev = _projectCache.get(id!) || { project: null, tasks: [], milestones: [], ts: 0 }
          _projectCache.set(id!, { ...prev, project: r.data, ts: Date.now() })
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

  const taskViewKey = `task_view_${user?.id}_${id}`

  const loadTasks = useCallback(() => {
    if (!id) return
    taskApi.list(id).then(r => {
      if (!r.success) return
      const data = r.data || []
      setTasks(data)
      const prev = _projectCache.get(id!) || { project: null, tasks: [], milestones: [], ts: 0 }
      _projectCache.set(id!, { ...prev, tasks: data })
      const lastView = localStorage.getItem(taskViewKey)
      const submitted = data.filter((t: any) => t.status === 'submitted')
      if (!lastView) {
        setHasNewSubmitted(submitted.length > 0)
      } else {
        const lastTs = new Date(lastView).getTime()
        setHasNewSubmitted(submitted.some((t: any) => new Date(t.created_at).getTime() > lastTs))
      }
    })
    milestoneApi.list(id).then(r => {
      if (!r.success) return
      setMilestones(r.data || [])
      const prev = _projectCache.get(id!) || { project: null, tasks: [], milestones: [], ts: 0 }
      _projectCache.set(id!, { ...prev, milestones: r.data || [] })
    })
  }, [id, taskViewKey])

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
    if (tab === 'tasks' && user?.id) {
      localStorage.setItem(`task_view_${user.id}_${id}`, new Date().toISOString())
      setHasNewSubmitted(false)
    }
    const timer = window.setTimeout(() => {
      loadProject()
      loadTasks()
      loadPendingJoinCount()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id, loadProject, loadTasks, loadPendingJoinCount])

  useEffect(() => {
    if (!project || !user) return
    const key = `project_guide_shown_${user.id}`
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => { setShowProjectGuide(true); localStorage.setItem(key, '1') }, 800)
      return () => clearTimeout(t)
    }
  }, [project, user])

  const { tabs: projectTabs, openTab, closeTab, updateTabName } = useProjectTabStore()

  useEffect(() => {
    if (project && id) {
      openTab(Number(id), project.name)
      updateTabName(Number(id), project.name)
    }
  }, [project?.name, id])

  if (projectLoading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>
  if (projectError) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div>{projectError}</div>
      <Button variant="secondary" onClick={() => loadProject()}>重试</Button>
    </div>
  )
  if (!project) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>项目不存在</div>

  const st = statusMap[project.status] || statusMap.planning
  const isOwner = (project.members || []).some((m: any) => m.user_id === user?.id && (m.project_role_key === 'owner' || m.member_role === 'owner'))
  const rawMembers = project.members || []
  const myMemberRow = rawMembers.find((m: any) => (m.user_id || m.id) === user?.id)
  const myRemarks: Record<string, string> = (() => {
    try {
      const r = myMemberRow?.remarks
      if (!r) return {}
      return typeof r === 'string' ? JSON.parse(r) : r
    } catch { return {} }
  })()
  const allMembers = rawMembers.map((m: any) => ({
    ...m,
    _remark: myRemarks[String(m.user_id || m.id)] || '',
  }))

  const handleDelete = async () => {
    if (!(await confirm({ message: '确定将此项目移到回收站？可在项目列表的回收站中恢复。', danger: true }))) return
    const r = await projectApi.remove(id!)
    if (r.success) { toast('项目已移至回收站', 'success'); nav('/projects') }
    else toast(r.message || '删除失败', 'error')
  }

  const refreshAvailableUsers = () => { projectApi.availableUsers(id!).then(r => { if (r.success) setAvailableUsers(r.data || []) }) }
  const refreshClientAvailableUsers = () => { projectApi.clientAvailableUsers(id!).then(r => { if (r.success) setClientAvailableUsers(r.data || []) }) }



  const _openManageClientMembers = () => {
    setShowAddClientMember(true)
    refreshClientAvailableUsers()
  }
  void _openManageClientMembers

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 48px)', overflow: 'hidden' }}>
      {projectTabs.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 2 } as any}>
          <div onClick={() => nav('/projects')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500, flexShrink: 0, transition: 'background 0.15s',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}>
            首页
          </div>
          {projectTabs.map(pt => {
            const isActive = String(pt.id) === String(id)
            return (
              <div key={pt.id}
                onClick={() => { if (!isActive) nav(`/projects/${pt.id}`) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: isActive ? 600 : 400, flexShrink: 0, transition: 'background 0.15s',
                  background: isActive ? 'var(--brand)' : 'var(--bg-tertiary)', color: isActive ? '#fff' : 'var(--text-secondary)', border: isActive ? 'none' : '1px solid var(--border-primary)' }}>
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pt.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); const nextId = closeTab(pt.id); if (isActive) { if (nextId) nav(`/projects/${nextId}`); else nav('/projects') } }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', borderRadius: 4 }}
                  onMouseEnter={e => { e.currentTarget.style.color = isActive ? '#fff' : 'var(--text-heading)'; e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)'; e.currentTarget.style.background = 'none' }}>
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}>
        <button onClick={() => nav('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4, flexShrink: 0 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: 'var(--text-heading)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0, cursor: project.join_code ? 'pointer' : 'default' }}
          title={project.join_code ? `点击复制项目 ID: ${project.join_code}` : undefined}
          onClick={() => { if (!project.join_code) return; const text = project.join_code; if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text) } else { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) } toast('项目 ID 已复制', 'success') }}>
          {project.name}
        </h1>
        <Badge color={st.color}>{st.label}</Badge>

        <div style={{ width: 1, height: 20, background: 'var(--border-primary)', flexShrink: 0, margin: '0 2px' }} />

        <div data-tour="project-tabs" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {([['tasks','需求'],['files','资料库'],['milestones','待办'],['messages','消息'],['settings','设置']] as [string, string][]).map(([k,v]) => (
            <button key={k} data-tour={`tab-${k}`} onClick={() => setTab(k as any)} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, position: 'relative', whiteSpace: 'nowrap', flexShrink: 0,
              background: tab === k ? 'var(--brand)' : 'var(--bg-tertiary)', color: tab === k ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}>
              {v}
              {k === 'tasks' && hasNewSubmitted && tab !== 'tasks' && (
                <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              )}
              {k === 'settings' && pendingJoinCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1 }}>
                  {pendingJoinCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <EditProjectModal open={showEditProject} project={project} onClose={() => setShowEditProject(false)}
        onSave={async (data) => {
          const r = await projectApi.update(id!, data)
          if (r.success) { toast('已更新', 'success'); loadProject(); return true }
          toast(r.message || '更新失败', 'error'); return false
        }} />


      <div style={{ flex: 1, minHeight: 0, paddingTop: 8, ...(tab === 'tasks' ? { display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } : { overflowY: 'auto' as const }) }}>
      <ManageMembersModal
          open={showAddMember}
          onClose={() => setShowAddMember(false)}
          projectId={id!}
          members={allMembers}
          availableUsers={availableUsers}
          projectRoles={projectRoles}
          onRefresh={loadProject}
          onRefreshAvailable={refreshAvailableUsers}
          onGoToRoles={(isOwner || canManageRole) ? () => setTab('settings') : undefined}
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

      {tab === 'tasks' && <TaskTab tasks={tasks} canEdit={canCreateTask} projectId={id!} loadTasks={loadTasks} remarkMap={myRemarks} />}

      {tab === 'files' && <ProjectFileTab projectId={id!} canEdit={canEdit} members={allMembers} currentUserId={user?.id} />}

      {tab === 'milestones' && <MilestoneTab milestones={milestones} projectId={id!} canEdit={canManageMilestone} onRefresh={loadTasks} isMobile={isMobile} members={allMembers} currentUserId={user?.id} remarkMap={myRemarks} />}

      {tab === 'messages' && <div style={{ background: 'var(--bg-primary)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16, overflow: 'hidden' }}><MessagePanel projectId={id!} /></div>}

      {tab === 'settings' && <ProjectSettingsTab project={project} projectId={id!} isOwner={isOwner} canManageRole={canManageRole} canApproveJoin={canApproveJoin} canEdit={canEdit} canDelete={canDelete} pendingJoinCount={pendingJoinCount} onRefreshProject={loadProject} onRefreshJoinCount={loadPendingJoinCount} onOpenAddMember={() => { setShowAddMember(true); refreshAvailableUsers() }} onMemberClick={setSelectedMember} onEditProject={() => setShowEditProject(true)} onDeleteProject={handleDelete} tasks={tasks} milestones={milestones} />}


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

      <MemberInfoModal member={selectedMember} onClose={() => setSelectedMember(null)} projectId={id!} remarkMap={myRemarks} onRemarkChange={loadProject} />
      <ClientInfoModal open={clientModal} onClose={() => setClientModal(false)} clientData={clientData} />
      <ProjectGuide open={showProjectGuide} onClose={() => setShowProjectGuide(false)} />
      </div>
    </div>
  )
}
