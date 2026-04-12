import { useState, useEffect, useRef } from 'react'
import { Users, Shield, AppWindow, UserPlus, ChevronRight, UserPlus2, Pencil, Trash2, LayoutDashboard, Clock, BarChart3, SlidersHorizontal } from 'lucide-react'
import useNicknameStore from '../../../stores/useNicknameStore'
import ProjectRoleList from './ProjectRoleList'
import AppTab from './AppTab'
import JoinRequestsTab from './JoinRequestsTab'
import ProjectOverviewTab from './ProjectOverviewTab'
import ProjectActivityTab from './ProjectActivityTab'
import ProjectStatsTab from './ProjectStatsTab'
import CustomFieldsManager from './CustomFieldsManager'
import Avatar from '../../ui/Avatar'
import Badge from '../../ui/Badge'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { projectApi } from '../services/api'
import useUserStore from '../../../stores/useUserStore'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

type SubTab = 'overview' | 'activity' | 'stats' | 'members' | 'roles' | 'app' | 'join_requests' | 'nickname' | 'custom_fields'

interface Props {
  project: any
  projectId: string
  isOwner: boolean
  canManageRole: boolean
  canApproveJoin: boolean
  canEdit?: boolean
  canDelete?: boolean
  isMobile?: boolean
  pendingJoinCount: number
  onRefreshProject: () => void
  onRefreshJoinCount: () => void
  onOpenAddMember: () => void
  onMemberClick?: (member: any) => void
  onEditProject?: () => void
  onDeleteProject?: () => void
  tasks?: any[]
  remarkMap?: Record<string, string>
}

const roleLabel: Record<string, string> = {
  owner: '创建者',
  editor: '编辑者',
  viewer: '查看者',
}

const settingsItems: { key: SubTab; label: string; icon: any; desc: string; condition?: string }[] = [
  { key: 'overview', label: '项目概览', icon: LayoutDashboard, desc: '查看项目统计、进度和动态' },
  { key: 'activity', label: '项目动态', icon: Clock, desc: '查看项目内的所有操作记录' },
  { key: 'stats', label: '统计看板', icon: BarChart3, desc: '完成率、成员排行、趋势图表' },
  { key: 'nickname', label: '项目备注', icon: Pencil, desc: '设置仅自己可见的项目备注名' },
  { key: 'members', label: '项目成员', icon: Users, desc: '查看和管理项目成员' },
  { key: 'roles', label: '角色管理', icon: Shield, desc: '自定义角色与权限配置', condition: 'canManageRole' },
  { key: 'app', label: '关联应用', icon: AppWindow, desc: '配置项目关联的外部应用', condition: 'hasApp' },
  { key: 'custom_fields', label: '扩展属性', icon: SlidersHorizontal, desc: '自定义字段（日期、金额、多选等）' },
  { key: 'join_requests', label: '加入申请', icon: UserPlus, desc: '审批成员加入请求', condition: 'canApproveJoin' },
]

export default function ProjectSettingsTab({ project, projectId, isOwner, canManageRole, canApproveJoin, canEdit, canDelete, isMobile, pendingJoinCount, onRefreshProject, onRefreshJoinCount, onOpenAddMember, onMemberClick, onEditProject, onDeleteProject, tasks = [] }: Props) {
  const [sub, setSub] = useState<SubTab | null>(null)
  const subRef = useRef(sub)
  subRef.current = sub

  useEffect(() => {
    (window as any).__gestureBackHandler = () => {
      if (subRef.current) { setSub(null); return true }
      return false
    }
    return () => { (window as any).__gestureBackHandler = null }
  }, [])

  const user = useUserStore(s => s.user)
  const globalDn = useNicknameStore(s => s.getDisplayName)
  const members = project.members || []
  const myMember = members.find((m: any) => (m.user_id || m.id) === user?.id)
  const currentNickname = myMember?.project_nickname || ''
  const [nicknameInput, setNicknameInput] = useState(currentNickname)
  const [nicknameSaving, setNicknameSaving] = useState(false)
  const saveNickname = async () => {
    setNicknameSaving(true)
    const r = await projectApi.setNickname(projectId, nicknameInput.trim())
    setNicknameSaving(false)
    if (r.success) {
      toast('备注已保存', 'success')
      onRefreshProject()
    } else {
      toast(r.message || '保存失败', 'error')
    }
  }

  const conditionMap: Record<string, boolean> = {
    canManageRole: isOwner || canManageRole,
    hasApp: !!project.app_url,
    canApproveJoin: canApproveJoin,
  }

  const visible = settingsItems.filter(i => !i.condition || conditionMap[i.condition])

  if (sub) {
    return (
      <div>
        <button onClick={() => setSub(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 12 }}>
          ← 返回设置
        </button>
        {sub === 'overview' && <ProjectOverviewTab project={project} projectId={projectId} />}
        {sub === 'activity' && <ProjectActivityTab projectId={projectId} />}
        {sub === 'stats' && <ProjectStatsTab projectId={projectId} />}
        {sub === 'nickname' && (
          <div style={section}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>项目备注</h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              项目原名：<b>{project.name}</b>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>备注名称</label>
              <input
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNickname()}
                placeholder="输入备注名（留空则显示原名）"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)' }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>备注仅自己可见，不影响其他成员</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={() => { setNicknameInput(currentNickname); setSub(null) }}>取消</Button>
              <Button onClick={saveNickname} disabled={nicknameSaving}>{nicknameSaving ? '保存中...' : '保存'}</Button>
            </div>
          </div>
        )}
        {sub === 'members' && (
          <div style={section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>项目成员 ({members.length})</h3>
              {isOwner && <Button onClick={onOpenAddMember}><UserPlus2 size={14} /> 管理成员</Button>}
            </div>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无成员</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {members.map((m: any) => {
                  const uid = String(m.user_id || m.id)
                  const name = globalDn(Number(uid), m.project_nickname || m.nickname || m.username || '?')
                  const rKey = m.project_role_key || m.member_role || ''
                  const rName = m.role_name || roleLabel[rKey] || rKey
                  return (
                    <div key={m.user_id || m.id}
                      onClick={() => onMemberClick?.(m)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: onMemberClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Avatar name={name} src={m.avatar} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        {m.username && m.nickname && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{m.username}</div>}
                      </div>
                      {rName && <Badge color={rKey === 'owner' ? 'blue' : rKey === 'editor' ? 'green' : 'gray'}>{rName}</Badge>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {sub === 'custom_fields' && <CustomFieldsManager projectId={projectId} />}
        {sub === 'roles' && <ProjectRoleList canEdit={isOwner || canManageRole} projectId={projectId} />}
        {sub === 'app' && <AppTab project={project} />}
        {sub === 'join_requests' && <JoinRequestsTab projectId={projectId} joinCode={project.join_code} onRefresh={() => { onRefreshProject(); onRefreshJoinCount() }} />}
      </div>
    )
  }

  return (
    <div>
    <div style={section}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>设置</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map(item => (
          <button key={item.key} onClick={() => { if (item.key === 'nickname') setNicknameInput(currentNickname); setSub(item.key) }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <item.icon size={18} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.label}
                {item.key === 'members' && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>({members.length})</span>}
                {item.key === 'join_requests' && pendingJoinCount > 0 && (
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: '#ef4444', color: '#fff', fontWeight: 600 }}>{pendingJoinCount}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {item.key === 'join_requests' && pendingJoinCount > 0
                  ? `${pendingJoinCount} 位成员等待审批`
                  : item.desc}
              </div>
            </div>
            {item.key === 'nickname' && currentNickname ? (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{currentNickname}</span>
            ) : item.key === 'members' && members.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
                {members.slice(0, 4).map((m: any, i: number) => (
                  <div key={m.user_id || m.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i, position: 'relative', borderRadius: '50%', border: '2px solid var(--bg-primary)', overflow: 'hidden', flexShrink: 0 }}>
                    <Avatar name={m.nickname || m.username || '?'} src={m.avatar} size={24} />
                  </div>
                ))}
                {members.length > 4 && (
                  <div style={{ marginLeft: -8, width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, border: '2px solid var(--bg-primary)', position: 'relative', zIndex: 0, flexShrink: 0 }}>
                    +{members.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <ChevronRight size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>

      {(canEdit || canDelete) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
          {canEdit && (
            <Button onClick={onEditProject}>
              <Pencil size={14} /> 编辑项目
            </Button>
          )}
          {canDelete && (
            <button onClick={onDeleteProject} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              <Trash2 size={14} /> 删除项目
            </button>
          )}
        </div>
      )}
    </div>
    </div>
  )
}
