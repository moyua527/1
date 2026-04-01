import { useState, useEffect } from 'react'
import { Building2, UserCircle } from 'lucide-react'
import { clientApi } from '../services/api'
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
  const [form, setForm] = useState({ client_type: 'company', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', assigned_to: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [enterpriseMembers, setEnterpriseMembers] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      clientApi.availableMembers().then(r => { if (r.success) setEnterpriseMembers(r.data || []) })
    }
  }, [open])

  const handleCreate = async () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '请输入客户名称'
    if (!form.channel) e.channel = '请选择渠道'
    if (form.client_type === 'company' && !form.company.trim()) e.company = '请输入公司名称'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSubmitting(true)
    const r = await clientApi.create(form)
    setSubmitting(false)
    if (r.success) {
      toast('客户添加成功', 'success')
      onClose()
      setForm({ client_type: 'company', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', assigned_to: '' })
      setErrors({})
      onCreated()
    } else toast(r.message || '添加失败', 'error')
  }

  const errStyle: React.CSSProperties = { fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }

  return (
    <Modal open={open} onClose={onClose} title="新增客户">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>客户类型</label>
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3 }}>
            {[{ key: 'company', label: '企业客户', icon: Building2 }, { key: 'individual', label: '个人客户', icon: UserCircle }].map(t => (
              <button key={t.key} type="button" onClick={() => setForm({ ...form, client_type: t.key, company: t.key === 'individual' ? '' : form.company })}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: form.client_type === t.key ? 'var(--bg-primary)' : 'transparent', color: form.client_type === t.key ? 'var(--text-heading)' : 'var(--text-secondary)',
                  boxShadow: form.client_type === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Input label="客户名称 *" placeholder="输入客户名称" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.name; return n }) }} />
          {errors.name && <div style={errStyle}>{errors.name}</div>}
        </div>
        {form.client_type === 'company' && (
          <div>
            <Input label="公司名称 *" placeholder="输入对方公司名称" value={form.company} onChange={e => { setForm({ ...form, company: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.company; return n }) }} />
            {errors.company && <div style={errStyle}>{errors.company}</div>}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="邮箱" placeholder="name@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="电话" placeholder="13800138000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>渠道 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <select value={form.channel} onChange={e => { setForm({ ...form, channel: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.channel; return n }) }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.channel ? 'var(--color-danger)' : 'var(--text-disabled)'}`, fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
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
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>客户阶段</label>
          <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            {Object.entries(stageMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>对接人（选填）</label>
          <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">暂不分配</option>
            {enterpriseMembers.map((u: any) => <option key={u.id} value={u.id}>{u.nickname || u.username} ({u.role === 'admin' ? '管理员' : '成员'})</option>)}
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
