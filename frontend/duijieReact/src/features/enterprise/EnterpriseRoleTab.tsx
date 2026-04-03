import { useState, useEffect } from 'react'
import { FolderKanban } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
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
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loadingProjects, setLoadingProjects] = useState(false)

  useEffect(() => {
    if (subTab === 'project' && projects.length === 0) {
      setLoadingProjects(true)
      fetchApi('/api/my-enterprise/projects').then(r => {
        if (r.success) {
          const list = r.data || []
          setProjects(list)
          if (list.length > 0 && !selectedProjectId) setSelectedProjectId(String(list[0].id))
        }
      }).finally(() => setLoadingProjects(false))
    }
  }, [subTab])

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

      {/* 项目角色 */}
      {subTab === 'project' && (
        <div style={{ padding: 20 }}>
          {loadingProjects ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>加载项目列表...</div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>
              <FolderKanban size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div>暂无企业项目</div>
            </div>
          ) : (
            <>
              {/* 项目选择器 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-body)', whiteSpace: 'nowrap' }}>选择项目：</label>
                <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                  style={{ flex: 1, maxWidth: 360, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)', cursor: 'pointer' }}>
                  {projects.map((p: any) => (
                    <option key={p.id} value={String(p.id)}>{p.name} (#{p.id})</option>
                  ))}
                </select>
              </div>

              {/* 选中项目的角色列表 */}
              {selectedProjectId && (
                <ProjectRoleList projectId={selectedProjectId} canEdit={canEdit} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
