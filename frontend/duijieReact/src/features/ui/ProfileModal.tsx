import { useState } from 'react'
import { Edit2, Copy } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import Avatar from './Avatar'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { toast } from './Toast'

const roleLabel: Record<string, string> = {
  admin: '管理员', member: '成员',
}

interface Props {
  open: boolean
  onClose: () => void
  user: any
  onProfileUpdated: (data: any) => void
}

export default function ProfileModal({ open, onClose, user, onProfileUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  const copyText = async (value: string, message: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
      else {
        const t = document.createElement('textarea')
        t.value = value
        t.style.position = 'fixed'
        t.style.opacity = '0'
        document.body.appendChild(t)
        t.select()
        document.execCommand('copy')
        document.body.removeChild(t)
      }
      toast(message, 'success')
    } catch {
      toast('复制失败', 'error')
    }
  }

  const startEditing = () => {
    if (user) setForm({ nickname: user.nickname || '', email: user.email || '', phone: user.phone || '', password: '', confirmPassword: '' })
    setEditing(true)
  }

  const handleSave = async () => {
    const body: any = {}
    if (form.nickname.trim() && form.nickname.trim() !== (user?.nickname || '')) body.nickname = form.nickname.trim()
    if (form.email.trim() !== (user?.email || '')) body.email = form.email.trim()
    if (form.phone.trim() !== (user?.phone || '')) body.phone = form.phone.trim()
    if (form.password) {
      if (form.password.length < 6) { toast('密码至少6位', 'error'); return }
      if (form.password !== form.confirmPassword) { toast('两次密码不一致', 'error'); return }
      body.password = form.password
    }
    if (Object.keys(body).length === 0) { toast('没有需要更新的内容', 'error'); return }
    setSaving(true)
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
    setSaving(false)
    if (r.success) { toast('个人信息已更新', 'success'); onProfileUpdated(r.data); onClose() }
    else toast(r.message || '更新失败', 'error')
  }

  const handleClose = () => {
    onClose()
    setEditing(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title={editing ? '编辑个人信息' : '个人信息'}>
      {user && !editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
            <Avatar name={user.nickname || user.username} size={64} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{user.nickname || user.username}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>@{user.username}</div>
              {user.display_id && <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: 0.5, marginTop: 2 }}>ID: {user.display_id}</div>}
              <div style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#2563eb', fontWeight: 500, marginTop: 4 }}>{roleLabel[user.role] || user.role}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>基本信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
              <div><span style={{ color: '#94a3b8' }}>昵称</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.nickname || '-'}</div></div>
              <div><span style={{ color: '#94a3b8' }}>邮箱</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.email || '-'}</div></div>
              <div><span style={{ color: '#94a3b8' }}>手机号</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.phone || '-'}</div></div>
              <div><span style={{ color: '#94a3b8' }}>性别</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.gender === 1 ? '男' : user.gender === 2 ? '女' : '-'}</div></div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>账号信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
              <div><span style={{ color: '#94a3b8' }}>用户名</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.username}</div></div>
              <div><span style={{ color: '#94a3b8' }}>角色</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{roleLabel[user.role] || user.role}</div></div>
              <div><span style={{ color: '#94a3b8' }}>注册时间</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</div></div>
              <div><span style={{ color: '#94a3b8' }}>用户ID</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>#{user.id}</div></div>
            </div>
          </div>

          {user.personal_invite_code && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>我的专属邀请码</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', borderRadius: 10, border: '1px solid #e0e7ff' }}>
              <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: '#1e40af', flex: 1 }}>{user.personal_invite_code}</code>
              <button onClick={() => copyText(user.personal_invite_code || '', '邀请码已复制')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid #c7d2fe', background: '#fff', color: '#4f46e5', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                <Copy size={14} /> 复制
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>分享此邀请码给新用户，对方注册后将自动成为你的客户</div>
          </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <Button variant="secondary" onClick={handleClose}>关闭</Button>
            <Button onClick={startEditing}><Edit2 size={14} /> 编辑资料</Button>
          </div>
        </div>
      )}
      {user && editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
            <Avatar name={user.nickname || user.username} size={64} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{user.nickname || user.username}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>@{user.username}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>基本信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="昵称" placeholder="输入昵称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
              <Input label="邮箱" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input label="手机号" placeholder="输入手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>安全设置</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="新密码（不修改请留空）" placeholder="至少6位" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              {form.password && (
                <Input label="确认密码" placeholder="再次输入新密码" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <Button variant="secondary" onClick={() => setEditing(false)}>返回</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存修改'}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
