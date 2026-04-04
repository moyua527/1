import { useState } from 'react'
import Avatar from '../../ui/Avatar'
import useNicknameStore from '../../../stores/useNicknameStore'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }
const VISIBLE_COUNT = 3

interface MembersSectionProps {
  myTeamTitle: string
  otherTeamTitle: string
  myMembers: any[]
  otherMembers: any[]
  showOtherTeam?: boolean
  canEditMyTeam: boolean
  onManageMyMembers: () => void
  onSelectMember: (member: any) => void
}

function MemberCard({ m, onClick, dn, bg, border }: { m: any; onClick: () => void; dn: (id: number, fallback: string) => string; bg?: string; border?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: bg || 'var(--bg-secondary)', borderRadius: 8, border: `1px solid ${border || 'var(--border-primary)'}`, cursor: 'pointer' }}
      onClick={onClick}>
      <Avatar name={dn(m.id, m.nickname || m.username || '?')} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{dn(m.id, m.nickname || m.username)}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {m.member_role === 'owner' ? '负责人' : m.project_role_name ? (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: m.project_role_color || 'var(--brand)', color: 'var(--bg-primary)', fontWeight: 500 }}>{m.project_role_name}</span>
          ) : '成员'}
        </div>
      </div>
    </div>
  )
}

export default function MembersSection({ myTeamTitle, otherTeamTitle, myMembers, otherMembers, showOtherTeam = true, canEditMyTeam, onManageMyMembers, onSelectMember }: MembersSectionProps) {
  const dn = useNicknameStore(s => s.getDisplayName)
  const [expanded, setExpanded] = useState(false)

  const visibleMembers = expanded ? myMembers : myMembers.slice(0, VISIBLE_COUNT)
  const hiddenCount = myMembers.length - VISIBLE_COUNT

  return (
    <div style={section}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>项目成员</h3>
        {canEditMyTeam && <button onClick={onManageMyMembers}
          style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>管理</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: showOtherTeam ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', display: 'block', marginBottom: 8 }}>{myTeamTitle}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visibleMembers.map((m: any) => (
              <MemberCard key={m.id} m={m} onClick={() => onSelectMember(m)} dn={dn} />
            ))}
            {myMembers.length === 0 && <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 8 }}>暂无</div>}
            {hiddenCount > 0 && (
              <button onClick={() => setExpanded(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px dashed var(--border-primary)', cursor: 'pointer', fontSize: 13, color: 'var(--brand)', fontWeight: 500 }}>
                {expanded ? '收起' : `查看更多成员 (${hiddenCount})`}
              </button>
            )}
          </div>
        </div>
        {showOtherTeam && (
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)', display: 'block', marginBottom: 8 }}>{otherTeamTitle}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {otherMembers.map((m: any) => (
                <MemberCard key={m.id} m={m} onClick={() => onSelectMember(m)} dn={dn} bg="#f0fdf4" border="#dcfce7" />
              ))}
              {otherMembers.length === 0 && <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 8 }}>暂无</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
