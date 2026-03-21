import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Shield, Loader2, Code2, Briefcase, User, MoreHorizontal, UserCheck, Megaphone, HeadphonesIcon, Eye, Users2, Search, Power, Link2, Copy, Clock, CheckCircle2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { clientApi } from '../client/services/api'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: '#dc2626', bg: '#fef2f2', icon: Shield },
  sales_manager: { label: '销售经理', color: '#ea580c', bg: '#fff7ed', icon: UserCheck },
  business: { label: '业务员', color: '#0891b2', bg: '#ecfeff', icon: Briefcase },
  marketing: { label: '市场', color: '#c026d3', bg: '#fdf4ff', icon: Megaphone },
  tech: { label: '技术', color: '#7c3aed', bg: '#f5f3ff', icon: Code2 },
  support: { label: '客服', color: '#0d9488', bg: '#f0fdfa', icon: HeadphonesIcon },
  member: { label: '成员', color: '#2563eb', bg: '#eff6ff', icon: User },
  viewer: { label: '只读', color: '#6b7280', bg: '#f3f4f6', icon: Eye },
  client: { label: '客户', color: '#16a34a', bg: '#f0fdf4', icon: Users2 },
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex', alignItems: 'center', gap: 16,
}

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', nickname: '', role: 'member', client_id: '', manager_id: '' })
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [inviteLinks, setInviteLinks] = useState<any[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ preset_role: 'member', expires_hours: '72', note: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      fetchApi('/api/users'),
      clientApi.list(),
      fetchApi('/api/invite-links'),
    ]).then(([ur, cr, lr]) => {
      if (ur.success) setUsers(ur.data || [])
      if (cr.success) setClients(cr.data || [])
      if (lr.success) setInviteLinks(lr.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const resetForm = () => setForm({ username: '', password: '', nickname: '', role: 'member', client_id: '', manager_id: '' })

  const handleCreate = async () => {
    if (!form.username.trim()) { toast('请输入用户名', 'error'); return }
    if (!form.password.trim()) { toast('请输入密码', 'error'); return }
    setSubmitting(true)
    const r = await fetchApi('/api/users', { method: 'POST', body: JSON.stringify(form) })
    setSubmitting(false)
    if (r.success) { toast('账号创建成功', 'success'); setShowCreate(false); resetForm(); load() }
    else toast(r.message || '创建失败', 'error')
  }

  const openEdit = (u: any) => {
    setEditUser(u)
    setForm({ username: u.username, password: '', nickname: u.nickname || '', role: u.role, client_id: u.client_id ? String(u.client_id) : '', manager_id: u.manager_id ? String(u.manager_id) : '' })
    setShowEdit(true)
  }

  const handleUpdate = async () => {
    if (!editUser) return
    setSubmitting(true)
    const body: any = { nickname: form.nickname, role: form.role, manager_id: form.manager_id ? Number(form.manager_id) : null }
    if (form.password.trim()) body.password = form.password
    const r = await fetchApi(`/api/users/${editUser.id}`, { method: 'PUT', body: JSON.stringify(body) })
    setSubmitting(false)
    if (r.success) { toast('更新成功', 'success'); setShowEdit(false); setEditUser(null); resetForm(); load() }
    else toast(r.message || '更新失败', 'error')
  }

  const handleDelete = async (u: any) => {
    if (!(await confirm({ message: `确定删除账号 "${u.username}"？`, danger: true }))) return
    const r = await fetchApi(`/api/users/${u.id}`, { method: 'DELETE' })
    if (r.success) { toast('已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const getClientName = (cid: number) => {
    const c = clients.find((cl: any) => cl.id === cid)
    return c ? `${c.name}${c.company ? ` (${c.company})` : ''}` : `#${cid}`
  }

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>用户管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>管理系统账号和角色权限 · 共 {users.length} 人</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setShowInviteModal(true)}><Link2 size={16} /> 邀请链接</Button>
          <Button onClick={() => { resetForm(); setShowCreate(true) }}><Plus size={16} /> 创建账号</Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户名/昵称..." style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
          {[{ key: 'all', label: '全部' }, { key: 'pending', label: `待审批(${users.filter(u => u.is_active === 0).length})` }, ...Object.entries(roleMap).map(([k, v]) => ({ key: k, label: v.label }))].map(t => (
            <button key={t.key} onClick={() => setRoleFilter(t.key)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid ' + (roleFilter === t.key ? '#2563eb' : '#e2e8f0'), background: roleFilter === t.key ? '#eff6ff' : '#fff', color: roleFilter === t.key ? '#2563eb' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.filter((u: any) => {
            if (roleFilter === 'pending') return u.is_active === 0
            if (roleFilter !== 'all' && u.role !== roleFilter) return false
            if (search.trim()) {
              const q = search.trim().toLowerCase()
              return (u.username || '').toLowerCase().includes(q) || (u.nickname || '').toLowerCase().includes(q)
            }
            return true
          }).map((u: any) => {
            const r = roleMap[u.role] || roleMap.member
            const RIcon = r.icon
            return (
              <div key={u.id} style={cardStyle}>
                <Avatar name={u.nickname || u.username} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{u.nickname || u.username}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: r.bg, color: r.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RIcon size={12} /> {r.label}
                    </span>
                    {u.is_active === 0 && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#fffbeb', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={10} /> 待审批</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>@{u.username}</div>
                  {u.manager_name && <div style={{ fontSize: 11, color: '#94a3b8' }}>上级: {u.manager_name}</div>}
                  {u.display_id && <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: 0.5 }}>ID: {u.display_id}</div>}
                </div>
                <div style={{ position: 'relative' }}>
                  <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === u.id ? null : u.id) }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                    <MoreHorizontal size={18} />
                  </button>
                  {menuOpen === u.id && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', zIndex: 50, minWidth: 120, overflow: 'hidden' }}>
                      <button onClick={() => { setMenuOpen(null); openEdit(u) }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Edit2 size={14} /> 编辑
                      </button>
                      {u.is_active === 0 && (
                        <button onClick={async () => { setMenuOpen(null); const r2 = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: 1 }) }); if (r2.success) { toast('已审批激活', 'success'); load() } else toast(r2.message || '操作失败', 'error') }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#16a34a' }} onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          <CheckCircle2 size={14} /> 审批激活
                        </button>
                      )}
                      <button onClick={async () => { setMenuOpen(null); const active = u.is_active !== 0; const r2 = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !active }) }); if (r2.success) { toast(active ? '已禁用' : '已启用', 'success'); load() } else toast(r2.message || '操作失败', 'error') }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: u.is_active !== 0 ? '#d97706' : '#16a34a' }} onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Power size={14} /> {u.is_active !== 0 ? '禁用' : '启用'}
                      </button>
                      <button onClick={() => { setMenuOpen(null); handleDelete(u) }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Trash2 size={14} /> 删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="创建账号">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="用户名" placeholder="登录用户名" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <Input label="密码" placeholder="登录密码" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>角色 <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="admin">管理员</option>
              <option value="sales_manager">销售经理</option>
              <option value="business">业务员</option>
              <option value="marketing">市场</option>
              <option value="tech">技术</option>
              <option value="support">客服</option>
              <option value="member">成员</option>
              <option value="viewer">只读</option>
              <option value="client">客户</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>上级经理</label>
            <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">无</option>
              {users.filter(u => ['admin', 'sales_manager'].includes(u.role)).map(u => (
                <option key={u.id} value={u.id}>{u.nickname || u.username} ({roleMap[u.role]?.label})</option>
              ))}
            </select>
          </div>
          {form.role === 'client' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>关联客户</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
                <option value="">无</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditUser(null) }} title="编辑账号">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>用户名: <strong>{editUser?.username}</strong></div>
          <Input label="新密码" placeholder="留空则不修改" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>角色</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="admin">管理员</option>
              <option value="sales_manager">销售经理</option>
              <option value="business">业务员</option>
              <option value="marketing">市场</option>
              <option value="tech">技术</option>
              <option value="support">客服</option>
              <option value="member">成员</option>
              <option value="viewer">只读</option>
              <option value="client">客户</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>上级经理</label>
            <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">无</option>
              {users.filter(u => ['admin', 'sales_manager'].includes(u.role) && u.id !== editUser?.id).map(u => (
                <option key={u.id} value={u.id}>{u.nickname || u.username} ({roleMap[u.role]?.label})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => { setShowEdit(false); setEditUser(null) }}>取消</Button>
            <Button onClick={handleUpdate} disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>

      {/* Invite Link Modal */}
      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="邀请链接管理">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>生成新邀请链接</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>预设角色</label>
                <select value={inviteForm.preset_role} onChange={e => setInviteForm({ ...inviteForm, preset_role: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>有效期</label>
                <select value={inviteForm.expires_hours} onChange={e => setInviteForm({ ...inviteForm, expires_hours: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="24">24小时</option>
                  <option value="72">3天</option>
                  <option value="168">7天</option>
                  <option value="720">30天</option>
                  <option value="">永久</option>
                </select>
              </div>
            </div>
            <Input label="备注" placeholder="可选" value={inviteForm.note} onChange={e => setInviteForm({ ...inviteForm, note: e.target.value })} />
            <Button onClick={async () => {
              const r2 = await fetchApi('/api/invite-links', { method: 'POST', body: JSON.stringify({ preset_role: inviteForm.preset_role, expires_hours: inviteForm.expires_hours ? Number(inviteForm.expires_hours) : null, note: inviteForm.note }) })
              if (r2.success) {
                const url = `${window.location.origin}/?invite=${r2.data.token}`
                navigator.clipboard.writeText(url).then(() => toast('链接已复制到剪贴板', 'success')).catch(() => toast('生成成功，请手动复制', 'success'))
                load()
              } else toast(r2.message || '生成失败', 'error')
            }}><Link2 size={14} /> 生成并复制链接</Button>
          </div>
          {inviteLinks.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>已生成的链接 ({inviteLinks.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {inviteLinks.map((link: any) => {
                  const used = !!link.used_by
                  const expired = link.expires_at && new Date(link.expires_at) < new Date()
                  const status = used ? '已使用' : expired ? '已过期' : '可用'
                  const statusColor = used ? '#16a34a' : expired ? '#dc2626' : '#2563eb'
                  return (
                    <div key={link.id} style={{ padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ color: statusColor, fontWeight: 600, fontSize: 11, padding: '1px 6px', borderRadius: 4, background: used ? '#f0fdf4' : expired ? '#fef2f2' : '#eff6ff' }}>{status}</span>
                          <span style={{ color: '#64748b' }}>角色: {roleMap[link.preset_role]?.label || link.preset_role}</span>
                          {link.note && <span style={{ color: '#94a3b8' }}>· {link.note}</span>}
                        </div>
                        {used && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>使用者: {link.used_by_name || link.used_by_username}</div>}
                      </div>
                      {!used && !expired && (
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?invite=${link.token}`); toast('已复制', 'success') }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}><Copy size={14} /></button>
                      )}
                      <button onClick={async () => { const r2 = await fetchApi(`/api/invite-links/${link.id}`, { method: 'DELETE' }); if (r2.success) { toast('已删除', 'success'); load() } }} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#dc2626', display: 'flex' }}><Trash2 size={14} /></button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
