import { useState } from 'react'
import { Phone, Mail, MessageSquare, UserPlus, Users, Star, Edit3, X } from 'lucide-react'
import { clientApi } from '../services/api'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Modal from '../../ui/Modal'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import { sectionStyle } from './constants'

interface Props { clientId: string; contacts: any[]; onRefresh: () => void }

export default function ContactSection({ clientId, contacts, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', position: '', phone: '', email: '', wechat: '', is_primary: false, notes: '' })
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditing(null); setForm({ name: '', position: '', phone: '', email: '', wechat: '', is_primary: false, notes: '' }); setModalOpen(true) }
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name || '', position: c.position || '', phone: c.phone || '', email: c.email || '', wechat: c.wechat || '', is_primary: !!c.is_primary, notes: c.notes || '' }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('请输入联系人姓名', 'error'); return }
    setSaving(true)
    const payload = { ...form, is_primary: form.is_primary ? 1 : 0 }
    const r = editing ? await clientApi.updateContact(editing.id, payload) : await clientApi.createContact({ ...payload, client_id: Number(clientId) })
    setSaving(false)
    if (r.success) { toast(editing ? '联系人已更新' : '联系人已添加', 'success'); setModalOpen(false); onRefresh() }
    else toast(r.message || '保存失败', 'error')
  }

  const handleDelete = async (cid: number) => {
    if (!(await confirm({ message: '确定删除此联系人？', danger: true }))) return
    const r = await clientApi.deleteContact(cid)
    if (r.success) { toast('联系人已删除', 'success'); onRefresh() }
    else toast(r.message || '删除失败', 'error')
  }

  return (
    <div style={{ ...sectionStyle, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="#7c3aed" />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>联系人</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>({contacts.length})</span>
        </div>
        <Button onClick={openAdd}><UserPlus size={14} /> 添加联系人</Button>
      </div>
      {contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无联系人，点击"添加联系人"开始</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {contacts.map((c: any) => (
            <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, position: 'relative' }}>
              {c.is_primary === 1 && <Star size={14} color="#f59e0b" fill="#f59e0b" style={{ position: 'absolute', top: 10, right: 10 }} />}
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{c.name}</div>
              {c.position && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{c.position}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {c.phone && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} color="#94a3b8" />{c.phone}</div>}
                {c.email && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} color="#94a3b8" />{c.email}</div>}
                {c.wechat && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} color="#94a3b8" />{c.wechat}</div>}
              </div>
              {c.notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{c.notes}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><X size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑联系人' : '添加联系人'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="姓名 *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="职位" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
          <Input label="电话" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="邮箱" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="微信" value={form.wechat} onChange={e => setForm({ ...form, wechat: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_primary} onChange={e => setForm({ ...form, is_primary: e.target.checked })} />
            设为主要联系人
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
