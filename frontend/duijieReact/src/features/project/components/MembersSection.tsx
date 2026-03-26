import Avatar from '../../ui/Avatar'

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface MembersSectionProps {
  project: any
  canEdit: boolean
  onManageMembers: () => void
  onManageClientMembers: () => void
  onSelectMember: (member: any) => void
}

export default function MembersSection({ project, canEdit, onManageMembers, onManageClientMembers, onSelectMember }: MembersSectionProps) {
  return (
    <div style={section}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>项目成员</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>我方团队</span>
            {canEdit && <button onClick={onManageMembers}
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>管理</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(project.members || []).filter((m: any) => m.source !== 'client').map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                onClick={() => onSelectMember(m)}>
                <Avatar name={m.nickname || m.username || '?'} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{m.nickname || m.username}</span>
                    {m.enterprise_role_name && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: m.enterprise_role_color || '#e2e8f0', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap' }}>{m.enterprise_role_name}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.member_role === 'owner' ? '负责人' : m.member_role === 'editor' ? '编辑者' : '查看者'}</div>
                </div>
              </div>
            ))}
            {(project.members || []).filter((m: any) => m.source !== 'client').length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, padding: 8 }}>暂无</div>}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>客户企业</span>
            <button onClick={onManageClientMembers}
              style={{ fontSize: 12, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>管理</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(project.members || []).filter((m: any) => m.source === 'client').map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7', cursor: 'pointer' }}
                onClick={() => onSelectMember(m)}>
                <Avatar name={m.nickname || m.username || '?'} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{m.nickname || m.username}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>查看者</div>
                </div>
              </div>
            ))}
            {(project.members || []).filter((m: any) => m.source === 'client').length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, padding: 8 }}>暂无</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
