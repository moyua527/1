import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { X } from 'lucide-react'
import useProjectTabStore from '../../../stores/useProjectTabStore'
import { can } from '../../../stores/permissions'
import { useInvalidate, useProjectUnreadSummary } from '../../../hooks/useApi'
import useProjectPerms from '../../../hooks/useProjectPerms'
import { fetchApi } from '../../../bootstrap'
import { projectApi } from '../services/api'
import { taskApi } from '../../task/services/api'
import Button from '../../ui/Button'
import { confirm } from '../../ui/ConfirmDialog'
import { toast } from '../../ui/Toast'
import TaskTab from './TaskTab'
import TodoTab from './TodoTab'
import ProjectFileTab from './ProjectFileTab'
import ProjectSettingsTab from './ProjectSettingsTab'
import MessagePanel from '../../message/components/MessagePanel'
import { ManageMembersModal, ManageClientMembersModal, MemberInfoModal, ClientInfoModal } from './ProjectModals'
import useLiveData from '../../../hooks/useLiveData'
import { onSocket } from '../../ui/smartSocket'
import EditProjectModal from './EditProjectModal'
import SetClientModal from './SetClientModal'
import ProjectGuide from '../../ui/ProjectGuide'




const PROJECT_DETAIL_TIMEOUT_MS = 8000

const _projectCache = new Map<string, { project: any; tasks: any[]; ts: number }>()

export default function ProjectDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const invalidate = useInvalidate()
  const { data: unreadSummary = {} } = useProjectUnreadSummary()
  const { user, isMobile } = useOutletContext<{ user: any; isMobile?: boolean }>()
  const role = user?.role || ''
  const platformCanEdit = can(role, 'project:edit')
  const platformCanDelete = can(role, 'project:delete')
  const { perms: projectPerms } = useProjectPerms(id)
  const isAdmin = role === 'admin'
  const canEdit = isAdmin || platformCanEdit || !!projectPerms?.can_edit_project_name || !!projectPerms?.can_edit_project_desc || !!projectPerms?.can_edit_project_status
  const canDelete = isAdmin || platformCanDelete || !!projectPerms?.can_delete_project
  const canApproveJoin = isAdmin || !!projectPerms?.can_approve_join
  const canCreateTask = isAdmin || !!projectPerms?.can_create_task
  const canManageRole = isAdmin || !!projectPerms?.can_create_role || !!projectPerms?.can_edit_role_name || !!projectPerms?.can_delete_role
  const cached = id ? _projectCache.get(id) : undefined
  const [project, setProject] = useState<any>(cached?.project ?? null)
  const projectRef = useRef<any>(cached?.project ?? null)
  const [projectLoading, setProjectLoading] = useState(!cached)
  const [projectError, setProjectError] = useState('')
  const [tasks, setTasks] = useState<any[]>(cached?.tasks ?? [])
  const activeIdRef = useRef(id)
  const [, setHasNewSubmitted] = useState(false)
  const [, setHasNewMessages] = useState(false)
  const [, setHasNewFiles] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['tasks', 'todo', 'files', 'messages', 'settings'] as const
  type Tab = typeof validTabs[number]
  const urlTab = searchParams.get('tab') as Tab
  const tab: Tab = validTabs.includes(urlTab as any) ? urlTab! : 'tasks'
  const setTab = (t: Tab) => {
    setSearchParams({ tab: t }, { replace: true })
    if (t === 'tasks') {
      localStorage.setItem(`task_view_${user?.id}_${id}`, new Date().toISOString())
      setHasNewSubmitted(false)
    }
    if (t === 'messages') setHasNewMessages(false)
    if (t === 'files') setHasNewFiles(false)
    if (id && ['tasks', 'todo', 'messages', 'files'].includes(t)) {
      fetchApi('/api/notifications/read-by-tab', {
        method: 'PATCH',
        body: JSON.stringify({ project_id: id, tab: t }),
      }).then(() => invalidate('project-unread-summary'))
    }
  }

  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddClientMember, setShowAddClientMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [clientAvailableUsers, setClientAvailableUsers] = useState<any[]>([])
  const [clientModal, setClientModal] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const [projectRoles, setProjectRoles] = useState<any[]>([])
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
    const requestId = id
    setProjectError('')

    let message = '项目加载失败，请稍后重试'
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const r = await Promise.race([
          projectApi.detail(id),
          new Promise<any>(resolve => setTimeout(() => resolve({ success: false, status: 408, message: '项目加载超时，请重试' }), PROJECT_DETAIL_TIMEOUT_MS)),
        ])
        if (requestId !== activeIdRef.current) return
        if (r.success && r.data) {
          projectRef.current = r.data
          setProject(r.data)
          setProjectError('')
          setProjectLoading(false)
          const prev = _projectCache.get(id!) || { project: null, tasks: [], ts: 0 }
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

    if (requestId !== activeIdRef.current) return
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

  const loadRoles = useCallback(() => {
    if (!id) return
    projectApi.listRoles(id).then(r => {
      if (r.success) setProjectRoles(r.data || [])
    })
  }, [id])

  const taskViewKey = `task_view_${user?.id}_${id}`

  const loadTasks = useCallback(() => {
    if (!id) return
    const requestId = id
    taskApi.list(id).then(r => {
      if (!r.success) return
      if (requestId !== activeIdRef.current) return
      const data = r.data || []
      setTasks(data)
      const prev = _projectCache.get(id!) || { project: null, tasks: [], ts: 0 }
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
  }, [id, taskViewKey])

  useEffect(() => {
    if (!id) return
    const off = onSocket('data_changed', (payload: any) => {
      if (payload?.project_id && String(payload.project_id) !== String(id)) return
      if (payload?.entity === 'task') loadTasks()
      if (payload?.entity === 'file') setHasNewFiles(true)
      invalidate('project-unread-summary')
    })
    return off
  }, [id, loadTasks])

  useEffect(() => {
    if (!id) return
    const off = onSocket('new_message', (payload: any) => {
      if (String(payload?.project_id) !== String(id)) return
      if (payload?.sender_id === user?.id) return
      setHasNewMessages(true)
      invalidate('project-unread-summary')
    })
    return off
  }, [id, user?.id])

  useEffect(() => {
    const off = onSocket('new_notification', () => {
      invalidate('project-unread-summary')
    })
    return off
  }, [])

  useEffect(() => {
    const off = onSocket('task_created', () => {
      invalidate('project-unread-summary')
    })
    return off
  }, [])

  useEffect(() => {
    activeIdRef.current = id
    const c = id ? _projectCache.get(id) : undefined
    setProject(c?.project ?? null)
    projectRef.current = c?.project ?? null
    setProjectLoading(!c)
    setProjectError('')
    setTasks(c?.tasks ?? [])
  }, [id])

  useEffect(() => {
    if (!id) return
    if (tab === 'tasks' && user?.id) {
      localStorage.setItem(`task_view_${user.id}_${id}`, new Date().toISOString())
      setHasNewSubmitted(false)
    }
    if (tab === 'messages') setHasNewMessages(false)
    if (tab === 'files') setHasNewFiles(false)
    if (['tasks', 'todo', 'messages', 'files'].includes(tab)) {
      fetchApi('/api/notifications/read-by-tab', {
        method: 'PATCH',
        body: JSON.stringify({ project_id: id, tab }),
      }).then(() => invalidate('project-unread-summary'))
    }
    const timer = window.setTimeout(() => {
      loadProject()
      loadTasks()
      loadPendingJoinCount()
      loadRoles()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id, loadProject, loadTasks, loadPendingJoinCount, loadRoles])

  useEffect(() => {
    if (!project || !user) return
    const key = `project_guide_shown_${user.id}`
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => { setShowProjectGuide(true); localStorage.setItem(key, '1') }, 800)
      return () => clearTimeout(t)
    }
  }, [project, user])

  const { tabs: projectTabs, openTab, closeTab, updateTabName, reorderTabs } = useProjectTabStore()

  const dragTabRef = useRef<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

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

  const isOwner = (project.members || []).some((m: any) => m.user_id === user?.id && (m.project_role_key === 'owner' || m.member_role === 'owner'))
  const rawMembers = project.members || []
  const allMembers = rawMembers

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
        <div style={{ display: 'flex', gap: 0, marginBottom: 0, flexShrink: 0, alignItems: 'stretch', background: 'linear-gradient(180deg, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.04) 100%)', borderRadius: '10px 10px 0 0', padding: '0 4px' }}>
          <div onClick={() => nav('/projects')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 600, flexShrink: 0, transition: 'background 0.15s',
              color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            首页
          </div>
          <div style={{ width: 1, background: 'rgba(59,130,246,0.15)', margin: '8px 2px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', display: 'flex', gap: 0 } as any}>
            {projectTabs.map(pt => {
              const isActive = String(pt.id) === String(id)
              const isDragOver = dragOverId === pt.id && dragTabRef.current !== pt.id
              return (
                <div key={pt.id}
                  draggable
                  onDragStart={e => { dragTabRef.current = pt.id; setDraggingId(pt.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(pt.id)) }}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverId(pt.id) }}
                  onDragLeave={() => { if (dragOverId === pt.id) setDragOverId(null) }}
                  onDrop={e => { e.preventDefault(); if (dragTabRef.current != null && dragTabRef.current !== pt.id) reorderTabs(dragTabRef.current, pt.id); dragTabRef.current = null; setDraggingId(null); setDragOverId(null) }}
                  onDragEnd={() => { dragTabRef.current = null; setDraggingId(null); setDragOverId(null) }}
                  onClick={() => { if (!isActive) nav(`/projects/${pt.id}`) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', cursor: 'grab', whiteSpace: 'nowrap', fontSize: 14, fontWeight: isActive ? 600 : 400, flexShrink: 0, transition: 'all 0.15s',
                    background: isActive ? 'var(--brand)' : 'transparent', color: isActive ? '#fff' : 'var(--text-secondary)',
                    borderRadius: isActive ? '8px 8px 0 0' : '0',
                    boxShadow: isDragOver ? '0 0 0 2px var(--brand)' : 'none', opacity: draggingId === pt.id ? 0.5 : 1 }}>
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pt.name}</span>
                  <button
                    onClick={async e => { e.stopPropagation(); if (!(await confirm({ message: `关闭「${pt.name}」标签页？` }))) return; const nextId = closeTab(pt.id); if (isActive) { if (nextId) nav(`/projects/${nextId}`); else nav('/projects') } }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: 4, display: 'flex', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', borderRadius: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.color = isActive ? '#fff' : 'var(--text-heading)'; e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'rgba(59,130,246,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)'; e.currentTarget.style.background = 'none' }}>
                    <X size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingLeft: 4, paddingTop: 4, paddingBottom: 8, background: 'linear-gradient(180deg, rgba(59,130,246,0.03) 0%, transparent 100%)' } as any}>
        <div data-tour="project-tabs" style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {([['tasks','需求'],['todo','代办'],['files','资料库'],['messages','消息'],['settings','设置']] as [string, string][]).map(([k,v]) => {
            const pInfo = id ? unreadSummary[id] : undefined
            const tabCount = pInfo ? (pInfo as any)[k] || 0 : 0
            const badgeCount = k === 'settings' ? pendingJoinCount : tabCount
            return (
              <button key={k} data-tour={`tab-${k}`} onClick={() => setTab(k as any)} style={{
                padding: '5px 14px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, position: 'relative', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
                background: tab === k ? 'var(--brand-light, rgba(59,130,246,0.1))' : 'transparent', color: tab === k ? 'var(--brand)' : 'var(--text-tertiary)',
                borderBottom: tab === k ? '2px solid var(--brand)' : '2px solid transparent',
              }}>
                {v}
                {badgeCount > 0 && tab !== k && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    minWidth: 14, height: 14, borderRadius: 7,
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                  }}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <EditProjectModal open={showEditProject} project={project} onClose={() => setShowEditProject(false)}
        onCoverChange={() => { loadProject(); invalidate('projects') }}
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

      {tab === 'tasks' && <TaskTab tasks={tasks} canEdit={canCreateTask} projectId={id!} loadTasks={loadTasks} />}

      {tab === 'todo' && <TodoTab projectId={id!} canEdit={isAdmin || !!projectPerms?.can_create_milestone || !!projectPerms?.can_edit_milestone} isMobile={isMobile} currentUserId={user?.id} members={allMembers} />}

      {tab === 'files' && <ProjectFileTab projectId={id!} canEdit={isAdmin || !!projectPerms?.can_upload_file || !!projectPerms?.can_delete_file} members={allMembers} currentUserId={user?.id} />}

      {tab === 'messages' && <div style={{ background: 'var(--bg-primary)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16, overflow: 'hidden' }}><MessagePanel projectId={id!} /></div>}

      {tab === 'settings' && <ProjectSettingsTab project={project} projectId={id!} isOwner={isOwner} canManageRole={canManageRole} canApproveJoin={canApproveJoin} canEdit={canEdit} canDelete={canDelete} pendingJoinCount={pendingJoinCount} onRefreshProject={loadProject} onRefreshJoinCount={loadPendingJoinCount} onOpenAddMember={() => { setShowAddMember(true); refreshAvailableUsers() }} onMemberClick={setSelectedMember} onEditProject={() => setShowEditProject(true)} onDeleteProject={handleDelete} tasks={tasks} />}


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
