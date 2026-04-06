import { useState, useEffect, useRef } from 'react'
import { Plus, X, Search } from 'lucide-react'
import Avatar from '../../ui/Avatar'
import useNicknameStore from '../../../stores/useNicknameStore'
import { projectApi } from '../services/api'
import { toast } from '../../ui/Toast'

const VISIBLE_COUNT = 12

const relationLabel: Record<string, { text: string; color: string }> = {
  colleague: { text: '企业同事', color: '#3b82f6' },
  friend: { text: '好友', color: '#22c55e' },
  collaborator: { text: '协作者', color: '#f59e0b' },
}

interface MembersSectionProps {
  projectId: string
  myMembers: any[]
  canEditMyTeam: boolean
  onManageMyMembers: () => void
  onSelectMember: (member: any) => void
  onRefresh: () => void
}

export default function MembersSection({ projectId, myMembers, canEditMyTeam, onManageMyMembers, onSelectMember, onRefresh }: MembersSectionProps) {
  const dn = useNicknameStore(s => s.getDisplayName)
  const [expanded, setExpanded] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [search, setSearch] = useState('')
  const [inviting, setInviting] = useState<number | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const sorted = [...myMembers].sort((a, b) => {
    if (a.project_role_key === 'owner') return -1
    if (b.project_role_key === 'owner') return 1
    return 0
  })
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT)
  const hiddenCount = sorted.length - VISIBLE_COUNT

  const openInvite = async () => {
    setInviteOpen(true)
    setSearch('')
    setLoadingUsers(true)
    const r = await projectApi.availableUsers(projectId)
    if (r.success) setAvailableUsers(r.data || [])
    setLoadingUsers(false)
  }

  const handleInvite = async (userId: number) => {
    setInviting(userId)
    const r = await projectApi.addMember(projectId, { user_id: userId, role: 'viewer' })
    setInviting(null)
    if (r.success) {
      toast('已邀请成员加入项目', 'success')
      window.dispatchEvent(new CustomEvent('onboarding-done', { detail: { type: 'invite_member' } }))
      setAvailableUsers(prev => prev.filter(u => u.id !== userId))
      onRefresh()
    } else {
      toast(r.message || '邀请失败', 'error')
    }
  }

  useEffect(() => {
    if (!inviteOpen) return
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setInviteOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [inviteOpen])

  const filtered = availableUsers.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.nickname || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)
  })

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
          const name = m._remark || dn(m.id, m.nickname || m.username || '?')
          const isOwner = m.project_role_key === 'owner'
          return (
            <div key={m.id}
              title={`${name}${m.project_role_name ? ` (${m.project_role_name})` : ''}`}
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
        <div style={{ position: 'relative' }}>
            <div title="邀请成员"
              onClick={openInvite}
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

            {inviteOpen && (
              <div ref={popupRef} style={{
                position: 'absolute', top: 44, right: 0, width: 280,
                background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 200, overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 8px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>邀请成员</span>
                  <button onClick={() => setInviteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2 }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ padding: '0 10px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                    <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户..."
                      style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12, color: 'var(--text-body)', flex: 1, padding: 0 }} />
                  </div>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', padding: '0 6px 8px' }}>
                  {loadingUsers && <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: 12 }}>加载中...</div>}
                  {!loadingUsers && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {search ? '没有匹配的用户' : '暂无可邀请的用户'}
                    </div>
                  )}
                  {filtered.map(u => {
                    const rel = relationLabel[u.relation]
                    return (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                        borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        onClick={() => inviting === null && handleInvite(u.id)}>
                        <Avatar name={u.nickname || u.username} size={30} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.nickname || u.username}
                          </div>
                          {rel && (
                            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: rel.color + '18', color: rel.color, fontWeight: 500 }}>
                              {rel.text}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: inviting === u.id ? 'var(--text-tertiary)' : 'var(--brand)', fontWeight: 500, flexShrink: 0 }}>
                          {inviting === u.id ? '邀请中...' : '邀请'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
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
