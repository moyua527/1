import { useState, useEffect } from 'react'
import { Building2, UserCircle } from 'lucide-react'
import { clientApi } from '../services/api'
import { can } from '../../../stores/permissions'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'

const stageMap: Record<string, { label: string }> = {
  potential: { label: '潜在' },
  intent: { label: '意向' },
  signed: { label: '签约' },
  active: { label: '合作中' },
  lost: { label: '流失' },
}

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function ClientCreateModal({ open, onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ user_id: '', client_type: 'company', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', position_level: '', department: '', job_function: '', assigned_to: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableMembers, setAvailableMembers] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      clientApi.availableMembers().then(r => { if (r.success) setAvailableMembers(r.data || []) })
    }
  }, [open])

  const handleSelectMember = (userId: string) => {
    const m = availableMembers.find((u: any) => String(u.id) === userId)
    if (m) {
      setForm(prev => ({ ...prev, user_id: userId, name: m.nickname || m.username, email: m.email || '', phone: m.phone || '' }))
    } else {
      setForm(prev => ({ ...prev, user_id: '', name: '', email: '', phone: '' }))
    }
  }

  const handleCreate = async () => {
    const e: Record<string, string> = {}
    if (!form.user_id) e.user_id = '请选择成员用户'
    if (!form.channel) e.channel = '请选择渠道'
    if (!form.name.trim()) e.name = '请输入客户名称'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSubmitting(true)
    const r = await clientApi.create({ ...form, user_id: Number(form.user_id) })
    setSubmitting(false)
    if (r.success) {
      toast('客户添加成功', 'success')
      onClose()
      setForm({ user_id: '', client_type: 'company', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', position_level: '', department: '', job_function: '', assigned_to: '' })
      setErrors({})
      onCreated()
    } else toast(r.message || '添加失败', 'error')
  }

  const errStyle: React.CSSProperties = { fontSize: 12, color: '#dc2626', marginTop: 4 }

  return (
    <Modal open={open} onClose={onClose} title="新增客户">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>选择成员用户 <span style={{ color: '#dc2626' }}>*</span></label>
          <div style={{ border: `1px solid ${errors.user_id ? '#dc2626' : '#e2e8f0'}`, borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
            {availableMembers.map((u: any) => {
              const selected = String(u.id) === form.user_id
              const name = u.nickname || u.username
              const initial = name.charAt(0)
              const roleColors: Record<string, string> = { admin: '#dc2626', tech: '#16a34a', business: '#2563eb', member: '#6b7280' }
              const bgColor = roleColors[u.role] || '#6b7280'
              const roleLabels: Record<string, string> = { admin: '管理员', tech: '技术员', business: '业务员', member: '成员', marketing: '市场', support: '客服' }
              return (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: selected ? '#f8fafc' : '#fff', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = '#fff' }}>
                  <input type="radio" name="client_member" checked={selected} onChange={() => { handleSelectMember(String(u.id)); setErrors(prev => { const n = { ...prev }; delete n.user_id; return n }) }}
                    style={{ width: 16, height: 16, accentColor: '#2563eb', cursor: 'pointer', flexShrink: 0 }} />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>@{u.username} · {roleLabels[u.role] || u.role}</div>
                  </div>
                </label>
              )
            })}
            {availableMembers.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>暂无可关联的成员用户</div>}
          </div>
          {errors.user_id && <div style={errStyle}>{errors.user_id}</div>}
        </div>
        <div>
          <Input label="客户名称 *" placeholder="自动填充" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.name; return n }) }} />
          {errors.name && <div style={errStyle}>{errors.name}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="邮箱" placeholder="自动填充" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="电话" placeholder="自动填充" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>客户类型</label>
          <div style={{ display: 'flex', gap: 0, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
            {[{ key: 'company', label: '企业客户', icon: Building2 }, { key: 'individual', label: '个人客户', icon: UserCircle }].map(t => (
              <button key={t.key} type="button" onClick={() => setForm({ ...form, client_type: t.key, company: t.key === 'individual' ? '' : form.company })}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: form.client_type === t.key ? '#fff' : 'transparent', color: form.client_type === t.key ? '#0f172a' : '#64748b',
                  boxShadow: form.client_type === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
        {form.client_type === 'company' && <Input label="公司名称" placeholder="输入公司名称" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>渠道 <span style={{ color: '#dc2626' }}>*</span></label>
          <select value={form.channel} onChange={e => { setForm({ ...form, channel: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.channel; return n }) }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.channel ? '#dc2626' : '#cbd5e1'}`, fontSize: 14, outline: 'none', background: '#fff' }}>
            <option value="">请选择渠道</option>
            <option value="Boss直聘">Boss直聘</option>
            <option value="微信">微信</option>
            <option value="抖音">抖音</option>
            <option value="小红书">小红书</option>
            <option value="淘宝">淘宝</option>
            <option value="拼多多">拼多多</option>
            <option value="线下推荐">线下推荐</option>
            <option value="其他">其他</option>
          </select>
          {errors.channel && <div style={errStyle}>{errors.channel}</div>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>客户阶段</label>
          <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
            {Object.entries(stageMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>对接人（选填）</label>
          <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
            <option value="">暂不分配</option>
            {availableMembers.filter(u => can(u.role, 'staff:assignable')).map((u: any) => <option key={u.id} value={u.id}>{u.nickname || u.username} ({u.role === 'admin' ? '管理' : u.role === 'business' ? '业务' : '技术'})</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleCreate} disabled={submitting}>{submitting ? '添加中...' : '添加'}</Button>
        </div>
      </div>
    </Modal>
  )
}
