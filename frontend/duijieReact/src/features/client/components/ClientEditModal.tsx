import { useState } from 'react'
import { Building2, UserCircle } from 'lucide-react'
import { clientApi } from '../services/api'
import { can } from '../../../stores/permissions'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Modal from '../../ui/Modal'
import { toast } from '../../ui/Toast'
import { channels, positionLevels, departmentOptions, jobFunctions, stageMap, fieldLabel } from './constants'

interface Props { open: boolean; onClose: () => void; client: any; clientId: string; onSaved: () => void }

export default function ClientEditModal({ open, onClose, client, clientId, onSaved }: Props) {
  const [form, setForm] = useState({ client_type: 'company', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', notes: '', position_level: '', department: '', job_function: '', assigned_to: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [inited, setInited] = useState(false)

  if (open && !inited) {
    setForm({ client_type: client.client_type || 'company', name: client.name || '', company: client.company || '', email: client.email || '', phone: client.phone || '', channel: client.channel || '', stage: client.stage || 'potential', notes: client.notes || '', position_level: client.position_level || '', department: client.department || '', job_function: client.job_function || '', assigned_to: client.assigned_to ? String(client.assigned_to) : '' })
    setErrors({})
    clientApi.availableMembers().then(r => { if (r.success) setStaffMembers((r.data || []).filter((u: any) => can(u.role, 'staff:assignable'))) })
    setInited(true)
  }
  if (!open && inited) setInited(false)

  const clr = (k: string) => setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  const ee = errors
  const es: React.CSSProperties = { fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }

  const handleSave = async () => {
    const e: Record<string, string> = {}
    if (!form.channel) e.channel = '请选择渠道'
    if (!form.name.trim()) e.name = '请输入客户名称'
    if (form.client_type === 'company' && !form.company.trim()) e.company = '请输入公司名称'
    if (!form.email.trim()) e.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = '邮箱格式不正确'
    if (!form.phone.trim()) e.phone = '请输入电话'
    else if (!/^1[3-9]\d{9}$/.test(form.phone.trim()) && !/^\d{7,15}$/.test(form.phone.trim().replace(/[-\s]/g, ''))) e.phone = '电话格式不正确'
    if (!form.position_level) e.position_level = '请选择职位级别'
    if (!form.department) e.department = '请选择部门'
    if (!form.job_function) e.job_function = '请选择工作职能'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    const r = await clientApi.update(clientId, form)
    setSaving(false)
    if (r.success) { toast('保存成功', 'success'); onClose(); onSaved() }
    else toast(r.message || '保存失败', 'error')
  }

  return (
    <Modal open={open} onClose={onClose} title="设置客户信息">
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
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>渠道 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <select value={form.channel} onChange={e => { setForm({ ...form, channel: e.target.value }); clr('channel') }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.channel ? 'var(--color-danger)' : 'var(--text-disabled)'}`, fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">请选择渠道</option>
            {channels.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {ee.channel && <div style={es}>{ee.channel}</div>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>客户阶段</label>
          <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            {Object.entries(stageMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div><Input label="客户名称 *" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); clr('name') }} />{ee.name && <div style={es}>{ee.name}</div>}</div>
        {form.client_type === 'company' && <div><Input label="公司 *" value={form.company} onChange={e => { setForm({ ...form, company: e.target.value }); clr('company') }} />{ee.company && <div style={es}>{ee.company}</div>}</div>}
        <div><Input label="邮箱 *" placeholder="name@example.com" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); clr('email') }} />{ee.email && <div style={es}>{ee.email}</div>}</div>
        <div><Input label="电话 *" placeholder="13800138000" value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); clr('phone') }} />{ee.phone && <div style={es}>{ee.phone}</div>}</div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>职位级别 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <select value={form.position_level} onChange={e => { setForm({ ...form, position_level: e.target.value }); clr('position_level') }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.position_level ? 'var(--color-danger)' : 'var(--text-disabled)'}`, fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">请选择职位级别</option>
            {positionLevels.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {ee.position_level && <div style={es}>{ee.position_level}</div>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>部门 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <select value={form.department} onChange={e => { setForm({ ...form, department: e.target.value }); clr('department') }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.department ? 'var(--color-danger)' : 'var(--text-disabled)'}`, fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">请选择部门</option>
            {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {ee.department && <div style={es}>{ee.department}</div>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>工作职能 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <select value={form.job_function} onChange={e => { setForm({ ...form, job_function: e.target.value }); clr('job_function') }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.job_function ? 'var(--color-danger)' : 'var(--text-disabled)'}`, fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">请选择工作职能</option>
            {jobFunctions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          {ee.job_function && <div style={es}>{ee.job_function}</div>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>对接人</label>
          <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">暂不分配</option>
            {staffMembers.map((u: any) => <option key={u.id} value={u.id}>{u.nickname || u.username} ({u.role === 'admin' ? '管理员' : '成员'})</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>备注</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        </div>
      </div>
    </Modal>
  )
}
