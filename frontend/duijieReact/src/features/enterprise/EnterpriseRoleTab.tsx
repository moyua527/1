import { useState } from 'react'
import { section } from './constants'
import RoleList from './RoleList'
import ProjectRoleList from '../project/components/ProjectRoleList'

interface Props {
  roles: any[]
  isOwner: boolean
  canManageRoles: boolean
  onCreateRole: (form: any) => Promise<void>
  onUpdateRole: (id: number, form: any) => Promise<void>
  onDeleteRole: (id: number) => Promise<void>
}

export default function EnterpriseRoleTab({ roles, isOwner, canManageRoles, onCreateRole, onUpdateRole, onDeleteRole }: Props) {
  const [subTab, setSubTab] = useState<'enterprise' | 'project'>('enterprise')
  const canEdit = isOwner || canManageRoles

  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', padding: 0 }}>
      {/* 子 Tab 栏 */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {([['enterprise', '企业角色'], ['project', '项目角色']] as const).map(([k, v]) => (
          <button key={k} onClick={() => setSubTab(k)}
            style={{ padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: subTab === k ? 'var(--brand)' : 'var(--text-secondary)', background: subTab === k ? 'var(--bg-primary)' : 'transparent',
              borderBottom: subTab === k ? '2px solid var(--brand)' : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
            {v}
          </button>
        ))}
      </div>

      {/* 企业角色 */}
      {subTab === 'enterprise' && (
        <RoleList
          roles={roles} isOwner={isOwner} canManageRoles={canManageRoles}
          onCreateRole={onCreateRole} onUpdateRole={onUpdateRole} onDeleteRole={onDeleteRole}
        />
      )}

      {/* 项目角色（企业级共享） */}
      {subTab === 'project' && (
        <div style={{ padding: 20 }}>
          <ProjectRoleList canEdit={canEdit} />
        </div>
      )}
    </div>
  )
}
