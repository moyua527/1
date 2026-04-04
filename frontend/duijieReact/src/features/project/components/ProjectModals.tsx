import { useState, useRef } from 'react'
import { User, Mail, Shield, Building2, Phone, MapPin, Edit3, X as XIcon } from 'lucide-react'
import useNicknameStore from '../../../stores/useNicknameStore'
import useUserStore from '../../../stores/useUserStore'
import Modal from '../../ui/Modal'
import Avatar from '../../ui/Avatar'
import Badge from '../../ui/Badge'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { projectApi } from '../services/api'
import { toast } from '../../ui/Toast'

const sysRoleLabel: Record<string, string> = { admin: '管理员', member: '成员' }

/* ── Manage project members modal ── */

interface ManageMembersModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  members: any[]
  availableUsers: any[]
  projectRoles?: any[]
  onRefresh: () => void
  onRefreshAvailable: () => void
}

function parseRoleValue(val: string): { role: string; project_role_id?: number } {
  if (val.startsWith('proj-')) return { role: 'editor', project_role_id: Number(val.slice(5)) }
  return { role: 'editor' }
}

function getMemberRoleValue(m: any): string {
  if (m.project_role_id) return `proj-${m.project_role_id}`
  return ''
}

export function ManageMembersModal({ open, onClose, projectId, members, availableUsers, projectRoles = [], onRefresh, onRefreshAvailable }: ManageMembersModalProps) {
  const dn = useNicknameStore(s => s.getDisplayName)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [selectedRole, setSelectedRole] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteResults, setInviteResults] = useState<any[]>([])
  const [inviteSearching, setInviteSearching] = useState(false)
  const [invitingId, setInvitingId] = useState<number | null>(null)
  const inviteTimerRef = useRef<any>(null)

  const handleInviteSearch = (q: string) => {
    setInviteSearch(q)
    if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current)
    if (!q.trim()) { setInviteResults([]); setInviteSearching(false); return }
    setInviteSearching(true)
    inviteTimerRef.current = setTimeout(async () => {
      const r = await projectApi.searchUsersForInvite(projectId, q.trim())
      setInviteSearching(false)
      if (r.success) setInviteResults(r.data || [])
    }, 400)
  }

  const handleInvite = async (userId: number) => {
    setInvitingId(userId)
    const r = await projectApi.inviteMember(projectId, { user_id: userId })
    setInvitingId(null)
    if (r.success) {
      toast('邀请已发送，等待审批', 'success')
      setInviteResults(prev => prev.filter(u => u.id !== userId))
    } else toast(r.message || '邀请失败', 'error')
  }

  const copyInviteLink = async () => {
    try {
      const r = await projectApi.detail(projectId)
      if (r.success && r.data?.join_code) {
        const link = `${window.location.origin}/join/${r.data.join_code}`
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(link)
        } else {
          const ta = document.createElement('textarea')
          ta.value = link
          ta.style.position = 'fixed'
          ta.style.left = '-9999px'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
        toast('邀请链接已复制', 'success')
      } else toast('该项目暂无邀请码', 'error')
    } catch { toast('复制失败', 'error') }
  }

  const roleOptions = (
    <>
      <option value="">选择角色</option>
      {projectRoles.map((r: any) => <option key={r.id} value={`proj-${r.id}`}>{r.name}</option>)}
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title="管理项目成员">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {members && members.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 8 }}>当前成员</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                  <Avatar name={dn(m.id, m.nickname || m.username || '?')} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{dn(m.id, m.nickname || m.username)}</div>
                  </div>
                  {m.member_role === 'owner' ? (
                    <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>负责人</span>
                  ) : (
                    <>
                      <select value={getMemberRoleValue(m)}
                        onChange={async (e) => {
                          const { role, project_role_id } = parseRoleValue(e.target.value)
                          const r = await projectApi.updateMemberRole(projectId, String(m.pm_id), { role, project_role_id: project_role_id ?? null })
                          if (r.success) { toast('角色已更新', 'success'); onRefresh() } else toast(r.message || '更新失败', 'error')
                        }}
                        style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: 'var(--bg-primary)', color: 'var(--text-body)', cursor: 'pointer' }}>
                        {roleOptions}
                      </select>
                      <button onClick={async () => { const r = await projectApi.removeMember(projectId, String(m.id)); if (r.success) { toast('已移除', 'success'); onRefresh(); onRefreshAvailable() } else toast(r.message || '移除失败', 'error') }}
                        style={{ padding: '4px 12px', borderRadius: 6, background: '#fef2f2', color: 'var(--color-danger)', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>移除</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 8 }}>添加新成员</label>
          <Input placeholder="输入用户名或昵称筛选" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 8, marginTop: 8 }}>
            {availableUsers.filter(u => { if (!memberSearch) return true; const s = memberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.username || '').toLowerCase().includes(s) || (sysRoleLabel[u.role] || '').includes(s) }).map((u: any) => {
              const checked = selectedUserIds.has(u.id)
              return (
              <div key={u.id} onClick={() => setSelectedUserIds(prev => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
                  background: checked ? 'var(--bg-selected)' : 'transparent',
                  borderBottom: '1px solid var(--border-secondary)' }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent' }}>
                <input type="checkbox" checked={checked} readOnly style={{ accentColor: 'var(--brand)', width: 16, height: 16, cursor: 'pointer' }} />
                <Avatar name={dn(u.id, u.nickname || u.username || '?')} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{dn(u.id, u.nickname || u.username)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{u.username} · {sysRoleLabel[u.role] || u.role}</div>
                </div>
              </div>
              )
            })}
            {availableUsers.filter(u => { if (!memberSearch) return true; const s = memberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.username || '').toLowerCase().includes(s) || (sysRoleLabel[u.role] || '').includes(s) }).length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>无可添加的用户</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
              {roleOptions}
            </select>
            {selectedUserIds.size > 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已选 {selectedUserIds.size} 人</span>}
            <Button disabled={selectedUserIds.size === 0 || submitting} onClick={async () => {
              setSubmitting(true)
              const { role, project_role_id } = parseRoleValue(selectedRole)
              let ok = 0
              let lastErr = ''
              for (const uid of selectedUserIds) {
                const r = await projectApi.addMember(projectId, { user_id: uid, role, project_role_id })
                if (r.success) ok++
                else lastErr = r.message || '添加失败'
              }
              setSubmitting(false)
              if (ok > 0) { toast(`已添加 ${ok} 名成员`, 'success'); setSelectedUserIds(new Set()); onRefresh(); onRefreshAvailable() }
              else toast(lastErr || '添加失败', 'error')
            }}>{submitting ? '添加中...' : `添加${selectedUserIds.size > 0 ? ` (${selectedUserIds.size})` : ''}`}</Button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)' }}>邀请外部用户</label>
            <button onClick={copyInviteLink}
              style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}>
              复制邀请链接
            </button>
          </div>
          <Input placeholder="输入用户ID、昵称或手机号搜索" value={inviteSearch} onChange={e => handleInviteSearch(e.target.value)} />
          <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 8 }}>
            {inviteSearching && <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-tertiary)', fontSize: 13 }}>搜索中...</div>}
            {!inviteSearching && inviteResults.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <Avatar name={u.nickname || '用户'} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{u.nickname || '用户'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID: {u.display_id || u.id}{u.phone ? ` · ${u.phone}` : ''}</div>
                </div>
                <button onClick={() => handleInvite(u.id)} disabled={invitingId === u.id}
                  style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer', opacity: invitingId === u.id ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {invitingId === u.id ? '...' : '邀请'}
                </button>
              </div>
            ))}
            {!inviteSearching && inviteSearch && inviteResults.length === 0 && <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-tertiary)', fontSize: 13 }}>未找到用户</div>}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ── Manage client members modal ── */

interface ManageClientMembersModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  clientMembers: any[]
  clientAvailableUsers: any[]
  onRefresh: () => void
  onRefreshAvailable: () => void
}

export function ManageClientMembersModal({ open, onClose, projectId, clientMembers, clientAvailableUsers, onRefresh, onRefreshAvailable }: ManageClientMembersModalProps) {
  const [selectedClientUserIds, setSelectedClientUserIds] = useState<Set<number>>(new Set())
  const [clientMemberSearch, setClientMemberSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="管理客户方成员">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {clientMembers.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 8 }}>当前客户方成员</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clientMembers.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7' }}>
                  <Avatar name={m.nickname || m.username || '?'} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{m.nickname || m.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>查看者</div>
                  </div>
                  <button onClick={async () => { const r = await projectApi.removeClientMember(projectId, String(m.id)); if (r.success) { toast('已移除', 'success'); onRefresh(); onRefreshAvailable() } else toast(r.message || '移除失败', 'error') }}
                    style={{ padding: '4px 12px', borderRadius: 6, background: '#fef2f2', color: 'var(--color-danger)', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>移除</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 8 }}>从客户企业添加成员</label>
          <Input placeholder="输入姓名筛选" value={clientMemberSearch} onChange={e => setClientMemberSearch(e.target.value)} />
          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 8, marginTop: 8 }}>
            {clientAvailableUsers.filter(u => { if (!clientMemberSearch) return true; const s = clientMemberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.member_name || '').toLowerCase().includes(s) }).map((u: any) => {
              const checked = selectedClientUserIds.has(u.id)
              return (
              <div key={u.id} onClick={() => setSelectedClientUserIds(prev => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: checked ? '#f0fdf4' : 'transparent', borderBottom: '1px solid var(--border-secondary)' }}>
                <input type="checkbox" checked={checked} readOnly style={{ accentColor: 'var(--color-success)', width: 16, height: 16, cursor: 'pointer' }} />
                <Avatar name={u.member_name || u.nickname || u.username || '?'} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{u.member_name || u.nickname || u.username}</div>
                  {u.position && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{u.position}</div>}
                </div>
              </div>
              )
            })}
            {clientAvailableUsers.filter(u => { if (!clientMemberSearch) return true; const s = clientMemberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.member_name || '').toLowerCase().includes(s) }).length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>无可添加的企业成员</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {selectedClientUserIds.size > 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已选 {selectedClientUserIds.size} 人</span>}
            <Button disabled={selectedClientUserIds.size === 0 || submitting} onClick={async () => {
              setSubmitting(true)
              let ok = 0
              for (const uid of selectedClientUserIds) {
                const r = await projectApi.addClientMember(projectId, { user_id: uid })
                if (r.success) ok++
              }
              setSubmitting(false)
              if (ok > 0) { toast(`已添加 ${ok} 名客户方成员`, 'success'); setSelectedClientUserIds(new Set()); onRefresh(); onRefreshAvailable() }
              else toast('添加失败', 'error')
            }}>{submitting ? '添加中...' : `添加${selectedClientUserIds.size > 0 ? ` (${selectedClientUserIds.size})` : ''}`}</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ── Member info modal ── */

interface MemberInfoModalProps {
  member: any | null
  onClose: () => void
}

export function MemberInfoModal({ member, onClose }: MemberInfoModalProps) {
  const currentUser = useUserStore(s => s.user)
  const { getDisplayName, setNickname, removeNickname, map } = useNicknameStore()
  const [editingNick, setEditingNick] = useState(false)
  const [nickInput, setNickInput] = useState('')
  const [nickSaving, setNickSaving] = useState(false)
  const isSelf = member && currentUser && member.id === currentUser.id
  const currentNick = member ? map[member.id] || '' : ''
  const displayName = member ? getDisplayName(member.id, member.nickname || member.username) : ''

  const handleSaveNick = async () => {
    if (!member) return
    setNickSaving(true)
    if (nickInput.trim()) {
      const ok = await setNickname(member.id, nickInput.trim())
      if (ok) toast('备注名已设置', 'success')
      else toast('设置失败', 'error')
    } else {
      const ok = await removeNickname(member.id)
      if (ok) toast('备注名已清除', 'success')
    }
    setNickSaving(false)
    setEditingNick(false)
  }

  return (
    <Modal open={!!member} onClose={() => { onClose(); setEditingNick(false) }} title="成员信息">
      {member && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
          <Avatar name={displayName} size={64} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)' }}>{displayName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>@{member.username}</div>
            {currentNick && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>原名：{member.nickname || member.username}</div>}
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-secondary)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 70 }}>用户名</span>
              <span style={{ fontSize: 14, color: 'var(--text-heading)', fontWeight: 500 }}>{member.username}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 70 }}>角色</span>
              {member.member_role === 'owner' ? (
                <Badge color="blue">负责人</Badge>
              ) : member.project_role_name ? (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: member.project_role_color || 'var(--brand)', color: 'var(--bg-primary)', fontWeight: 500 }}>{member.project_role_name}</span>
              ) : (
                <Badge color="gray">成员</Badge>
              )}
            </div>
            {member.nickname && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 70 }}>昵称</span>
                <span style={{ fontSize: 14, color: 'var(--text-heading)', fontWeight: 500 }}>{member.nickname}</span>
              </div>
            )}
            {/* 备注名 */}
            {!isSelf && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit3 size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 70 }}>备注名</span>
                {editingNick ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <input value={nickInput} onChange={e => setNickInput(e.target.value)} placeholder="输入备注名（留空则清除）"
                      autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveNick(); if (e.key === 'Escape') setEditingNick(false) }}
                      style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
                    <Button onClick={handleSaveNick} disabled={nickSaving} style={{ padding: '4px 10px', fontSize: 12 }}>{nickSaving ? '...' : '保存'}</Button>
                    <button onClick={() => setEditingNick(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2 }}><XIcon size={14} /></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <span style={{ fontSize: 14, color: currentNick ? 'var(--text-heading)' : 'var(--text-tertiary)', fontWeight: currentNick ? 500 : 400 }}>{currentNick || '未设置'}</span>
                    <button onClick={() => { setNickInput(currentNick); setEditingNick(true) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: 12, fontWeight: 500, padding: '2px 6px' }}>
                      {currentNick ? '修改' : '设置'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ── Client info modal ── */

interface ClientInfoModalProps {
  open: boolean
  onClose: () => void
  clientData: any | null
}

export function ClientInfoModal({ open, onClose, clientData }: ClientInfoModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="企业信息">
      {!clientData ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>加载中...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-selected)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={24} color="var(--brand)" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>{clientData.name}</div>
              {clientData.company && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{clientData.company}</div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {clientData.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={15} color="var(--text-secondary)" /><span style={{ fontSize: 14, color: 'var(--text-body)' }}>{clientData.email}</span></div>}
            {clientData.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={15} color="var(--text-secondary)" /><span style={{ fontSize: 14, color: 'var(--text-body)' }}>{clientData.phone}</span></div>}
            {clientData.address && <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2' }}><MapPin size={15} color="var(--text-secondary)" /><span style={{ fontSize: 14, color: 'var(--text-body)' }}>{clientData.address}</span></div>}
          </div>
          {clientData.notes && <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>备注</div><div style={{ fontSize: 14, color: 'var(--text-body)' }}>{clientData.notes}</div></div>}
          {clientData.members && clientData.members.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>企业成员</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clientData.members.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <Avatar name={m.name} size={28} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                    {m.position && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.position}</span>}
                    {m.phone && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{m.phone}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
