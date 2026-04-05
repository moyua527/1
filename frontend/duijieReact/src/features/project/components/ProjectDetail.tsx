import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Trash2, MoreVertical, Pencil, X } from 'lucide-react'
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
  const [project, setProject] = useState<any>(null)
  const projectRef = useRef<any>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [hasNewSubmitted, setHasNewSubmitted] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['tasks', 'files', 'milestones', 'settings'] as const
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
  const [showActionMenu, setShowActionMenu] = useState(false)
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
      const lastView = localStorage.getItem(taskViewKey)
      const submitted = data.filter((t: any) => t.status === 'submitted')
      if (!lastView) {
        setHasNewSubmitted(submitted.length > 0)
      } else {
        const lastTs = new Date(lastView).getTime()
        setHasNewSubmitted(submitted.some((t: any) => new Date(t.created_at).getTime() > lastTs))
      }
    })
    milestoneApi.list(id).then(r => { if (r.success) setMilestones(r.data || []) })
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
  const allMembers = project.members || []

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
      {projectTabs.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 2 } as any}>
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

      <div data-tour="project-tabs" style={{ display: 'flex', gap: 8, marginBottom: 0, flexShrink: 0, ...(isMobile ? { overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } : { flexWrap: 'wrap' }) } as any}>
        {([['tasks','需求'],['files','资料库'],['milestones','待办'],['settings','设置']] as [string, string][]).map(([k,v]) => (
          <button key={k} data-tour={`tab-${k}`} onClick={() => setTab(k as any)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, position: 'relative', whiteSpace: 'nowrap', flexShrink: 0,
            background: tab === k ? 'var(--brand)' : 'var(--bg-tertiary)', color: tab === k ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}>
            {v}
            {k === 'tasks' && hasNewSubmitted && tab !== 'tasks' && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            )}
            {k === 'settings' && pendingJoinCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', lineHeight: 1 }}>
                {pendingJoinCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, paddingTop: 16, ...(tab === 'tasks' ? { display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } : { overflowY: 'auto' as const }) }}>
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

      {tab === 'tasks' && <TaskTab tasks={tasks} canEdit={canCreateTask} projectId={id!} loadTasks={loadTasks} />}

      {tab === 'files' && <ProjectFileTab projectId={id!} canEdit={canEdit} />}

      {tab === 'milestones' && <MilestoneTab milestones={milestones} projectId={id!} canEdit={canManageMilestone} onRefresh={loadTasks} isMobile={isMobile} />}

      {tab === 'settings' && <ProjectSettingsTab project={project} projectId={id!} isOwner={isOwner} canManageRole={canManageRole} canApproveJoin={canApproveJoin} pendingJoinCount={pendingJoinCount} onRefreshProject={loadProject} onRefreshJoinCount={loadPendingJoinCount} onOpenAddMember={() => { setShowAddMember(true); refreshAvailableUsers() }} onMemberClick={setSelectedMember} />}


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
      <ProjectGuide open={showProjectGuide} onClose={() => setShowProjectGuide(false)} />
      </div>
    </div>
  )
}
