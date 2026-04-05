import { useState } from 'react'
import { Users, Shield, AppWindow, UserPlus, ChevronRight, MessageSquare, UserPlus2 } from 'lucide-react'
import MessagePanel from '../../message/components/MessagePanel'
import ProjectRoleList from './ProjectRoleList'
import AppTab from './AppTab'
import JoinRequestsTab from './JoinRequestsTab'
import Avatar from '../../ui/Avatar'
import Badge from '../../ui/Badge'
import Button from '../../ui/Button'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

type SubTab = 'members' | 'messages' | 'roles' | 'app' | 'join_requests'

interface Props {
  project: any
  projectId: string
  isOwner: boolean
  canManageRole: boolean
  canApproveJoin: boolean
  pendingJoinCount: number
  onRefreshProject: () => void
  onRefreshJoinCount: () => void
  onOpenAddMember: () => void
  onMemberClick?: (member: any) => void
}

const roleLabel: Record<string, string> = {
  owner: '创建者',
  editor: '编辑者',
  viewer: '查看者',
}

const settingsItems: { key: SubTab; label: string; icon: any; desc: string; condition?: string }[] = [
  { key: 'members', label: '项目成员', icon: Users, desc: '查看和管理项目成员' },
  { key: 'messages', label: '消息', icon: MessageSquare, desc: '项目成员间的实时消息' },
  { key: 'roles', label: '角色管理', icon: Shield, desc: '自定义角色与权限配置', condition: 'canManageRole' },
  { key: 'app', label: '关联应用', icon: AppWindow, desc: '配置项目关联的外部应用', condition: 'hasApp' },
  { key: 'join_requests', label: '加入申请', icon: UserPlus, desc: '审批成员加入请求', condition: 'canApproveJoin' },
]

export default function ProjectSettingsTab({ project, projectId, isOwner, canManageRole, canApproveJoin, pendingJoinCount, onRefreshProject, onRefreshJoinCount, onOpenAddMember, onMemberClick }: Props) {
  const [sub, setSub] = useState<SubTab | null>(null)

  const conditionMap: Record<string, boolean> = {
    canManageRole: isOwner || canManageRole,
    hasApp: !!project.app_url,
    canApproveJoin: canApproveJoin,
  }

  const visible = settingsItems.filter(i => !i.condition || conditionMap[i.condition])
  const members = project.members || []

  if (sub) {
    return (
      <div>
        <button onClick={() => setSub(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 12 }}>
          ← 返回设置
        </button>
        {sub === 'members' && (
          <div style={section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>项目成员 ({members.length})</h3>
              {isOwner && <Button onClick={onOpenAddMember}><UserPlus2 size={14} /> 添加成员</Button>}
            </div>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无成员</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {members.map((m: any) => {
                  const name = m.nickname || m.username || '?'
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
        {sub === 'messages' && <div style={section}><MessagePanel projectId={projectId} /></div>}
        {sub === 'roles' && <ProjectRoleList canEdit={isOwner || canManageRole} projectId={projectId} />}
        {sub === 'app' && <AppTab project={project} />}
        {sub === 'join_requests' && <JoinRequestsTab projectId={projectId} joinCode={project.join_code} onRefresh={() => { onRefreshProject(); onRefreshJoinCount() }} />}
      </div>
    )
  }

  return (
    <div style={section}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>设置</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map(item => (
          <button key={item.key} onClick={() => setSub(item.key)}
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
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
            </div>
            {item.key === 'members' && members.length > 0 ? (
              <div style={{ display: 'flex', marginRight: 4 }}>
                {members.slice(0, 4).map((m: any, i: number) => (
                  <div key={m.user_id || m.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
                    <Avatar name={m.nickname || m.username || '?'} src={m.avatar} size={24} />
                  </div>
                ))}
                {members.length > 4 && (
                  <div style={{ marginLeft: -8, width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, border: '2px solid var(--bg-primary)' }}>
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
    </div>
  )
}
