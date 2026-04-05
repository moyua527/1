import { useState } from 'react'
import { Users, Shield, AppWindow, UserPlus, ChevronRight } from 'lucide-react'
import MessagePanel from '../../message/components/MessagePanel'
import ProjectRoleList from './ProjectRoleList'
import AppTab from './AppTab'
import JoinRequestsTab from './JoinRequestsTab'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

type SubTab = 'messages' | 'roles' | 'app' | 'join_requests'

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
}

const settingsItems: { key: SubTab; label: string; icon: any; desc: string; condition?: string }[] = [
  { key: 'messages', label: '消息', icon: Users, desc: '项目成员间的实时消息' },
  { key: 'roles', label: '角色管理', icon: Shield, desc: '自定义角色与权限配置', condition: 'canManageRole' },
  { key: 'app', label: '关联应用', icon: AppWindow, desc: '配置项目关联的外部应用', condition: 'hasApp' },
  { key: 'join_requests', label: '加入申请', icon: UserPlus, desc: '审批成员加入请求', condition: 'canApproveJoin' },
]

export default function ProjectSettingsTab({ project, projectId, isOwner, canManageRole, canApproveJoin, pendingJoinCount, onRefreshProject, onRefreshJoinCount, onOpenAddMember }: Props) {
  const [sub, setSub] = useState<SubTab | null>(null)

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
                {item.key === 'join_requests' && pendingJoinCount > 0 && (
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: '#ef4444', color: '#fff', fontWeight: 600 }}>{pendingJoinCount}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <ChevronRight size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
