import { useState } from 'react'
import { User, Mail, Shield, Building2, Phone, MapPin } from 'lucide-react'
import Modal from '../../ui/Modal'
import Avatar from '../../ui/Avatar'
import Badge from '../../ui/Badge'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { projectApi } from '../services/api'
import { toast } from '../../ui/Toast'

const sysRoleLabel: Record<string, string> = { admin: '管理员', tech: '技术员', business: '业务员', member: '成员' }

/* ── Manage project members modal ── */

interface ManageMembersModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  members: any[]
  availableUsers: any[]
  enterpriseRoles?: any[]
  onRefresh: () => void
  onRefreshAvailable: () => void
}

export function ManageMembersModal({ open, onClose, projectId, members, availableUsers, enterpriseRoles = [], onRefresh, onRefreshAvailable }: ManageMembersModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [memberRole, setMemberRole] = useState('editor')
  const [selectedEntRoleId, setSelectedEntRoleId] = useState<string>('')
  const [memberSearch, setMemberSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="管理项目成员">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {members && members.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>当前成员</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <Avatar name={m.nickname || m.username || '?'} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{m.nickname || m.username}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.member_role === 'owner' ? '负责人' : m.member_role === 'editor' ? '编辑者' : '查看者'}</div>
                  </div>
                  {m.member_role !== 'owner' && enterpriseRoles.length > 0 && (
                    <select value={m.enterprise_role_id || ''}
                      onChange={async (e) => {
                        const rid = e.target.value ? Number(e.target.value) : null
                        const r = await projectApi.updateMemberRole(projectId, String(m.pm_id), { enterprise_role_id: rid })
                        if (r.success) { toast('角色已更新', 'success'); onRefresh() } else toast(r.message || '更新失败', 'error')
                      }}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff', color: '#334155', cursor: 'pointer' }}>
                      <option value="">无项目角色</option>
                      {enterpriseRoles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}
                  {m.member_role !== 'owner' && (
                    <button onClick={async () => { const r = await projectApi.removeMember(projectId, String(m.id)); if (r.success) { toast('已移除', 'success'); onRefresh(); onRefreshAvailable() } else toast(r.message || '移除失败', 'error') }}
                      style={{ padding: '4px 12px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>移除</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>添加新成员</label>
          <Input placeholder="输入用户名或昵称筛选" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 8 }}>
            {availableUsers.filter(u => { if (!memberSearch) return true; const s = memberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.username || '').toLowerCase().includes(s) || (sysRoleLabel[u.role] || '').includes(s) }).map((u: any) => {
              const checked = selectedUserIds.has(u.id)
              return (
              <div key={u.id} onClick={() => setSelectedUserIds(prev => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
                  background: checked ? '#eff6ff' : 'transparent',
                  borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent' }}>
                <input type="checkbox" checked={checked} readOnly style={{ accentColor: '#2563eb', width: 16, height: 16, cursor: 'pointer' }} />
                <Avatar name={u.nickname || u.username || '?'} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{u.nickname || u.username}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>@{u.username} · {sysRoleLabel[u.role] || u.role}</div>
                </div>
              </div>
              )
            })}
            {availableUsers.filter(u => { if (!memberSearch) return true; const s = memberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.username || '').toLowerCase().includes(s) || (sysRoleLabel[u.role] || '').includes(s) }).length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>无可添加的用户</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <select value={memberRole} onChange={e => setMemberRole(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="editor">编辑者</option>
              <option value="viewer">查看者</option>
            </select>
            {enterpriseRoles.length > 0 && (
              <select value={selectedEntRoleId} onChange={e => setSelectedEntRoleId(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
                <option value="">无项目角色</option>
                {enterpriseRoles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
            {selectedUserIds.size > 0 && <span style={{ fontSize: 12, color: '#64748b' }}>已选 {selectedUserIds.size} 人</span>}
            <Button disabled={selectedUserIds.size === 0 || submitting} onClick={async () => {
              setSubmitting(true)
              let ok = 0
              for (const uid of selectedUserIds) {
                const r = await projectApi.addMember(projectId, { user_id: uid, role: memberRole, enterprise_role_id: selectedEntRoleId ? Number(selectedEntRoleId) : undefined })
                if (r.success) ok++
              }
              setSubmitting(false)
              if (ok > 0) { toast(`已添加 ${ok} 名成员`, 'success'); setSelectedUserIds(new Set()); onRefresh(); onRefreshAvailable() }
              else toast('添加失败', 'error')
            }}>{submitting ? '添加中...' : `添加${selectedUserIds.size > 0 ? ` (${selectedUserIds.size})` : ''}`}</Button>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>当前客户方成员</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clientMembers.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7' }}>
                  <Avatar name={m.nickname || m.username || '?'} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{m.nickname || m.username}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>查看者</div>
                  </div>
                  <button onClick={async () => { const r = await projectApi.removeClientMember(projectId, String(m.id)); if (r.success) { toast('已移除', 'success'); onRefresh(); onRefreshAvailable() } else toast(r.message || '移除失败', 'error') }}
                    style={{ padding: '4px 12px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>移除</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>从客户企业添加成员</label>
          <Input placeholder="输入姓名筛选" value={clientMemberSearch} onChange={e => setClientMemberSearch(e.target.value)} />
          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 8 }}>
            {clientAvailableUsers.filter(u => { if (!clientMemberSearch) return true; const s = clientMemberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.member_name || '').toLowerCase().includes(s) }).map((u: any) => {
              const checked = selectedClientUserIds.has(u.id)
              return (
              <div key={u.id} onClick={() => setSelectedClientUserIds(prev => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: checked ? '#f0fdf4' : 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                <input type="checkbox" checked={checked} readOnly style={{ accentColor: '#16a34a', width: 16, height: 16, cursor: 'pointer' }} />
                <Avatar name={u.member_name || u.nickname || u.username || '?'} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{u.member_name || u.nickname || u.username}</div>
                  {u.position && <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.position}</div>}
                </div>
              </div>
              )
            })}
            {clientAvailableUsers.filter(u => { if (!clientMemberSearch) return true; const s = clientMemberSearch.toLowerCase(); return (u.nickname || '').toLowerCase().includes(s) || (u.member_name || '').toLowerCase().includes(s) }).length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>无可添加的企业成员</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {selectedClientUserIds.size > 0 && <span style={{ fontSize: 12, color: '#64748b' }}>已选 {selectedClientUserIds.size} 人</span>}
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
  return (
    <Modal open={!!member} onClose={onClose} title="成员信息">
      {member && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
          <Avatar name={member.nickname || member.username || '?'} size={64} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{member.nickname || member.username}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>@{member.username}</div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={16} color="#64748b" />
              <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>用户名</span>
              <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{member.username}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={16} color="#64748b" />
              <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>项目角色</span>
              <Badge color={member.member_role === 'owner' ? 'blue' : member.member_role === 'editor' ? 'green' : 'gray'}>
                {member.member_role === 'owner' ? '负责人' : member.member_role === 'editor' ? '编辑者' : '查看者'}
              </Badge>
            </div>
            {member.enterprise_role_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={16} color="#64748b" />
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>企业角色</span>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: member.enterprise_role_color || '#64748b', color: '#fff', fontWeight: 500 }}>{member.enterprise_role_name}</span>
              </div>
            )}
            {member.nickname && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="#64748b" />
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>昵称</span>
                <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{member.nickname}</span>
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
        <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>加载中...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={24} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{clientData.name}</div>
              {clientData.company && <div style={{ fontSize: 13, color: '#64748b' }}>{clientData.company}</div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {clientData.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={15} color="#64748b" /><span style={{ fontSize: 14, color: '#334155' }}>{clientData.email}</span></div>}
            {clientData.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={15} color="#64748b" /><span style={{ fontSize: 14, color: '#334155' }}>{clientData.phone}</span></div>}
            {clientData.address && <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2' }}><MapPin size={15} color="#64748b" /><span style={{ fontSize: 14, color: '#334155' }}>{clientData.address}</span></div>}
          </div>
          {clientData.notes && <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>备注</div><div style={{ fontSize: 14, color: '#334155' }}>{clientData.notes}</div></div>}
          {clientData.members && clientData.members.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>企业成员</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clientData.members.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
                    <Avatar name={m.name} size={28} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                    {m.position && <span style={{ fontSize: 12, color: '#64748b' }}>{m.position}</span>}
                    {m.phone && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{m.phone}</span>}
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
