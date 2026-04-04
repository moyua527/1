import { useState } from 'react'
import { Plus } from 'lucide-react'
import Avatar from '../../ui/Avatar'
import useNicknameStore from '../../../stores/useNicknameStore'

const VISIBLE_COUNT = 12

interface MembersSectionProps {
  myMembers: any[]
  canEditMyTeam: boolean
  onManageMyMembers: () => void
  onSelectMember: (member: any) => void
}

export default function MembersSection({ myMembers, canEditMyTeam, onManageMyMembers, onSelectMember }: MembersSectionProps) {
  const dn = useNicknameStore(s => s.getDisplayName)
  const [expanded, setExpanded] = useState(false)

  const sorted = [...myMembers].sort((a, b) => {
    if (a.member_role === 'owner') return -1
    if (b.member_role === 'owner') return 1
    return 0
  })
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT)
  const hiddenCount = sorted.length - VISIBLE_COUNT

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>
          项目成员 <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>({myMembers.length})</span>
        </h3>
        {canEditMyTeam && (
          <button onClick={onManageMyMembers}
            style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            管理
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {visible.map((m: any) => {
          const name = dn(m.id, m.nickname || m.username || '?')
          const isOwner = m.member_role === 'owner'
          return (
            <div key={m.id}
              title={`${name}${isOwner ? ' (负责人)' : m.project_role_name ? ` (${m.project_role_name})` : ''}`}
              onClick={() => onSelectMember(m)}
              style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
              <Avatar name={name} size={38} src={m.avatar || undefined} />
              {isOwner && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#f59e0b', border: '2px solid var(--bg-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: '#fff', fontWeight: 700
                }}>★</div>
              )}
            </div>
          )
        })}
        {canEditMyTeam && (
          <div title="添加成员"
            onClick={onManageMyMembers}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '2px dashed var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s', color: 'var(--text-tertiary)',
              background: 'var(--bg-secondary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'var(--bg-secondary)' }}>
            <Plus size={18} />
          </div>
        )}
      </div>
      {hiddenCount > 0 && (
        <button onClick={() => setExpanded(v => !v)}
          style={{ marginTop: 10, fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
          {expanded ? '收起' : `查看全部 ${myMembers.length} 人`}
        </button>
      )}
      {myMembers.length === 0 && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '12px 0' }}>暂无成员</div>
      )}
    </div>
  )
}
