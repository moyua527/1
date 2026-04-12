import { useState, useEffect } from 'react'
import { fetchApi } from '../../../bootstrap'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import { FormSection, FormGrid, FormActions } from '../../ui/Form'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import { roleMap, roleOptions } from '../constants'

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
        <FormSection title="基础信息">
          <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          <FormGrid>
            <Input label="手机号" placeholder="11位手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="邮箱" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </FormGrid>
        </FormSection>

        <FormSection title="账号信息">
          <FormGrid>
            <Input label="用户名 *" placeholder="登录用户名" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            <Input label="密码 *" placeholder="登录密码" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </FormGrid>
        </FormSection>

        <FormSection title="权限信息">
          <FormGrid>
            <Select label="角色 *" value={form.role} onChange={v => setForm({ ...form, role: v })} options={roleOptions} />
            <Select label="上级经理" value={form.manager_id} onChange={v => setForm({ ...form, manager_id: v })} placeholder="无" options={users.filter(u => u.role === 'admin').map(u => ({ value: String(u.id), label: `${u.nickname || u.username} (${roleMap[u.role]?.label})` }))} />
          </FormGrid>
        </FormSection>

        <FormActions onCancel={onClose} onSubmit={handleCreate} submitText={submitting ? '创建中...' : '创建'} loading={submitting} />
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="编辑用户">
      <FormSection title="基础信息">
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0' }}>用户名: <strong style={{ color: 'var(--text-heading)' }}>{editUser?.username}</strong></div>
        <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
        <FormGrid>
          <Input label="手机号" placeholder="11位手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="邮箱" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </FormGrid>
      </FormSection>

      <FormSection title="账号安全">
        <Input label="新密码" placeholder="留空则不修改" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      </FormSection>

      <FormSection title="权限信息">
        <FormGrid>
          <Select label="角色" value={form.role} onChange={v => setForm({ ...form, role: v })} options={roleOptions} />
          <Select label="上级经理" value={form.manager_id} onChange={v => setForm({ ...form, manager_id: v })} placeholder="无" options={users.filter(u => u.role === 'admin' && u.id !== editUser?.id).map(u => ({ value: String(u.id), label: `${u.nickname || u.username} (${roleMap[u.role]?.label})` }))} />
        </FormGrid>
      </FormSection>

      <FormActions onCancel={onClose} onSubmit={handleUpdate} submitText={submitting ? '保存中...' : '保存'} loading={submitting} />
    </Modal>
  )
}
