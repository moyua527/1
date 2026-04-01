import { useState } from 'react'
import { Building, Building2, Phone, Mail, UserPlus, Edit3, X } from 'lucide-react'
import { clientApi } from '../services/api'
import Avatar from '../../ui/Avatar'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Modal from '../../ui/Modal'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import { sectionStyle } from './constants'

interface Props { clientId: string; members: any[]; onRefresh: () => void; embedded?: boolean }

export default function EnterpriseMemberSection({ clientId, members, onRefresh, embedded }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', position: '', department: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditing(null); setForm({ name: '', position: '', department: '', phone: '', email: '', notes: '' }); setModalOpen(true) }
  const openEdit = (m: any) => { setEditing(m); setForm({ name: m.name || '', position: m.position || '', department: m.department || '', phone: m.phone || '', email: m.email || '', notes: m.notes || '' }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('请输入成员姓名', 'error'); return }
    setSaving(true)
    const r = editing ? await clientApi.updateMember(editing.id, form) : await clientApi.createMember(clientId, form)
    setSaving(false)
    if (r.success) { toast(editing ? '成员已更新' : '成员已添加', 'success'); setModalOpen(false); onRefresh() }
    else toast(r.message || '保存失败', 'error')
  }

  const handleDelete = async (mid: number) => {
    if (!(await confirm({ message: '确定删除此成员？', danger: true }))) return
    const r = await clientApi.deleteMember(mid)
    if (r.success) { toast('成员已删除', 'success'); onRefresh() }
    else toast(r.message || '删除失败', 'error')
  }

  return (
    <div style={embedded ? {} : { ...sectionStyle, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={18} color="var(--brand)" />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-body)' }}>企业成员</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({members.length})</span>
        </div>
        <Button onClick={openAdd}><UserPlus size={14} /> 添加成员</Button>
      </div>
      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无企业成员，点击"添加成员"开始</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {members.map((m: any) => (
            <div key={m.id} style={{ border: '1px solid var(--border-primary)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Avatar name={m.name} size={36} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{m.name}</div>
                  {m.position && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.position}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {m.department && <div style={{ fontSize: 13, color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 4 }}><Building size={12} color="#94a3b8" />{m.department}</div>}
                {m.phone && <div style={{ fontSize: 13, color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} color="#94a3b8" />{m.phone}</div>}
                {m.email && <div style={{ fontSize: 13, color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} color="#94a3b8" />{m.email}</div>}
              </div>
              {m.notes && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{m.notes}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => openEdit(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2, display: 'flex' }}><X size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑企业成员' : '添加企业成员'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="姓名 *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="职位" placeholder="如：技术总监" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
          <Input label="部门" placeholder="如：技术部" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          <Input label="电话" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="邮箱" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>备注</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
