import { useState, useEffect } from 'react'
import { Shield, Code2, Briefcase, User } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: '#dc2626', bg: '#fef2f2', icon: Shield },
  tech: { label: '技术员', color: '#7c3aed', bg: '#f5f3ff', icon: Code2 },
  business: { label: '业务员', color: '#0891b2', bg: '#ecfeff', icon: Briefcase },
  member: { label: '成员', color: '#2563eb', bg: '#eff6ff', icon: User },
}

const selectStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }

const groupTitle = (t: string) => <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', padding: '8px 0 4px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>{t}</div>

const emptyForm = { username: '', password: '', nickname: '', role: 'member', email: '', phone: '', client_id: '', manager_id: '' }

interface UserFormModalProps {
  mode: 'create' | 'edit'
  editUser: any
  open: boolean
  onClose: () => void
  onSaved: () => void
  users: any[]
}

export default function UserFormModal({ mode, editUser, open, onClose, onSaved, users }: UserFormModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && editUser) {
      setForm({
        username: editUser.username,
        password: '',
        nickname: editUser.nickname || '',
        role: editUser.role,
        email: editUser.email || '',
        phone: editUser.phone || '',
        client_id: editUser.client_id ? String(editUser.client_id) : '',
        manager_id: editUser.manager_id ? String(editUser.manager_id) : '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, mode, editUser])

  const handleCreate = async () => {
    if (!form.username.trim()) { toast('请输入用户名', 'error'); return }
    if (!form.password.trim()) { toast('请输入密码', 'error'); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast('邮箱格式不正确', 'error'); return }
    if (form.phone && !/^1\d{10}$/.test(form.phone)) { toast('手机号格式不正确', 'error'); return }
    setSubmitting(true)
    const r = await fetchApi('/api/users', { method: 'POST', body: JSON.stringify(form) })
    setSubmitting(false)
    if (r.success) { toast('账号创建成功', 'success'); onClose(); onSaved() }
    else toast(r.message || '创建失败', 'error')
  }

  const handleUpdate = async () => {
    if (!editUser) return
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast('邮箱格式不正确', 'error'); return }
    if (form.phone && !/^1\d{10}$/.test(form.phone)) { toast('手机号格式不正确', 'error'); return }
    if (form.role !== editUser.role) {
      if (!(await confirm({ message: `确定将角色从「${roleMap[editUser.role]?.label}」改为「${roleMap[form.role]?.label}」？`, danger: false }))) return
    }
    setSubmitting(true)
    const body: any = { nickname: form.nickname, role: form.role, email: form.email || null, phone: form.phone || null, manager_id: form.manager_id ? Number(form.manager_id) : null }
    if (form.password.trim()) body.password = form.password
    const r = await fetchApi(`/api/users/${editUser.id}`, { method: 'PUT', body: JSON.stringify(body) })
    setSubmitting(false)
    if (r.success) { toast('更新成功', 'success'); onClose(); onSaved() }
    else toast(r.message || '更新失败', 'error')
  }

  if (mode === 'create') {
    return (
      <Modal open={open} onClose={onClose} title="新增用户">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupTitle('基础信息')}
          <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Input label="手机号" placeholder="11位手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div style={{ flex: 1 }}><Input label="邮箱" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>

          {groupTitle('账号信息')}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Input label="用户名 *" placeholder="登录用户名" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><Input label="密码 *" placeholder="登录密码" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
          </div>

          {groupTitle('权限信息')}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>角色 <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={selectStyle}>
                {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>上级经理</label>
              <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })} style={selectStyle}>
                <option value="">无</option>
                {users.filter(u => u.role === 'admin').map(u => (
                  <option key={u.id} value={u.id}>{u.nickname || u.username} ({roleMap[u.role]?.label})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="编辑用户">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groupTitle('基础信息')}
        <div style={{ fontSize: 13, color: '#64748b', padding: '4px 0' }}>用户名: <strong style={{ color: '#0f172a' }}>{editUser?.username}</strong></div>
        <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Input label="手机号" placeholder="11位手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div style={{ flex: 1 }}><Input label="邮箱" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        </div>

        {groupTitle('账号安全')}
        <Input label="新密码" placeholder="留空则不修改" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

        {groupTitle('权限信息')}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>角色</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={selectStyle}>
              {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>上级经理</label>
            <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })} style={selectStyle}>
              <option value="">无</option>
              {users.filter(u => u.role === 'admin' && u.id !== editUser?.id).map(u => (
                <option key={u.id} value={u.id}>{u.nickname || u.username} ({roleMap[u.role]?.label})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleUpdate} disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button>
        </div>
      </div>
    </Modal>
  )
}
