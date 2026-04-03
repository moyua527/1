import Avatar from '../../ui/Avatar'
import useNicknameStore from '../../../stores/useNicknameStore'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface MembersSectionProps {
  myTeamTitle: string
  otherTeamTitle: string
  myMembers: any[]
  otherMembers: any[]
  showOtherTeam?: boolean
  canEditMyTeam: boolean
  onManageMyMembers: () => void
  onInviteMember?: () => void
  onSelectMember: (member: any) => void
}

export default function MembersSection({ myTeamTitle, otherTeamTitle, myMembers, otherMembers, showOtherTeam = true, canEditMyTeam, onManageMyMembers, onInviteMember, onSelectMember }: MembersSectionProps) {
  const dn = useNicknameStore(s => s.getDisplayName)
  return (
    <div style={section}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>项目成员</h3>
      <div style={{ display: 'grid', gridTemplateColumns: showOtherTeam ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>{myTeamTitle}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {onInviteMember && <button onClick={onInviteMember}
                style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>邀请</button>}
              {canEditMyTeam && <button onClick={onManageMyMembers}
                style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>管理</button>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {myMembers.map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-primary)', cursor: 'pointer' }}
                onClick={() => onSelectMember(m)}>
                <Avatar name={dn(m.id, m.nickname || m.username || '?')} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{dn(m.id, m.nickname || m.username)}</span>
                    {m.project_role_name && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: m.project_role_color || 'var(--border-primary)', color: 'var(--bg-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{m.project_role_name}</span>}
                    {!m.project_role_name && m.enterprise_role_name && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: m.enterprise_role_color || 'var(--border-primary)', color: 'var(--bg-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{m.enterprise_role_name}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.member_role === 'owner' ? '负责人' : m.member_role === 'editor' ? '编辑者' : '查看者'}</div>
                </div>
              </div>
            ))}
            {myMembers.length === 0 && <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 8 }}>暂无</div>}
          </div>
        </div>
        {showOtherTeam && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>{otherTeamTitle}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {otherMembers.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7', cursor: 'pointer' }}
                  onClick={() => onSelectMember(m)}>
                  <Avatar name={dn(m.id, m.nickname || m.username || '?')} size={28} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{dn(m.id, m.nickname || m.username)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>查看者</div>
                  </div>
                </div>
              ))}
              {otherMembers.length === 0 && <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 8 }}>暂无</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
