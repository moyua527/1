import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Shield, Loader2, Code2, Briefcase, User, MoreHorizontal } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { clientApi } from '../client/services/api'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理人员', color: '#dc2626', bg: '#fef2f2', icon: Shield },
  tech: { label: '技术人员', color: '#7c3aed', bg: '#f5f3ff', icon: Code2 },
  business: { label: '业务人员', color: '#0891b2', bg: '#ecfeff', icon: Briefcase },
  member: { label: '普通成员', color: '#2563eb', bg: '#eff6ff', icon: User },
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
  const [form, setForm] = useState({ username: '', password: '', nickname: '', role: 'member', client_id: '' })
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetchApi('/api/users'),
      clientApi.list(),
    ]).then(([ur, cr]) => {
      if (ur.success) setUsers(ur.data || [])
      if (cr.success) setClients(cr.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const resetForm = () => setForm({ username: '', password: '', nickname: '', role: 'member', client_id: '' })

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
    setForm({ username: u.username, password: '', nickname: u.nickname || '', role: u.role, client_id: u.client_id ? String(u.client_id) : '' })
    setShowEdit(true)
  }

  const handleUpdate = async () => {
    if (!editUser) return
    setSubmitting(true)
    const body: any = { nickname: form.nickname, role: form.role }
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
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>管理系统账号和角色权限</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true) }}><Plus size={16} /> 创建账号</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map((u: any) => {
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
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>@{u.username}</div>
                  {u.display_id && <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: 0.5 }}>ID: {u.display_id}</div>}
                </div>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                    <MoreHorizontal size={18} />
                  </button>
                  {menuOpen === u.id && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', zIndex: 50, minWidth: 120, overflow: 'hidden' }}>
                      <button onClick={() => { setMenuOpen(null); openEdit(u) }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Edit2 size={14} /> 编辑
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
              <option value="admin">管理人员</option>
              <option value="tech">技术人员</option>
              <option value="business">业务人员</option>
              <option value="member">普通成员</option>
            </select>
          </div>
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
              <option value="admin">管理人员</option>
              <option value="tech">技术人员</option>
              <option value="business">业务人员</option>
              <option value="member">普通成员</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => { setShowEdit(false); setEditUser(null) }}>取消</Button>
            <Button onClick={handleUpdate} disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
