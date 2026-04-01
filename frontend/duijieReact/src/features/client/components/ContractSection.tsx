import { useState } from 'react'
import { FileSignature, DollarSign, Plus, Edit3, X } from 'lucide-react'
import { clientApi } from '../services/api'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Modal from '../../ui/Modal'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import { sectionStyle, contractStatusMap } from './constants'

interface Props { clientId: string; contracts: any[]; onRefresh: () => void; embedded?: boolean }

export default function ContractSection({ clientId, contracts, onRefresh, embedded }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', amount: '', status: 'draft', signed_date: '', expire_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditing(null); setForm({ title: '', amount: '', status: 'draft', signed_date: '', expire_date: '', notes: '' }); setModalOpen(true) }
  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ title: c.title || '', amount: String(c.amount || ''), status: c.status || 'draft', signed_date: c.signed_date ? new Date(c.signed_date).toISOString().slice(0, 10) : '', expire_date: c.expire_date ? new Date(c.expire_date).toISOString().slice(0, 10) : '', notes: c.notes || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast('请输入合同标题', 'error'); return }
    setSaving(true)
    const payload = { ...form, amount: Number(form.amount) || 0 }
    const r = editing ? await clientApi.updateContract(editing.id, payload) : await clientApi.createContract({ ...payload, client_id: Number(clientId) })
    setSaving(false)
    if (r.success) { toast(editing ? '合同已更新' : '合同已创建', 'success'); setModalOpen(false); onRefresh() }
    else toast(r.message || '保存失败', 'error')
  }

  const handleDelete = async (cid: number) => {
    if (!(await confirm({ message: '确定删除此合同？', danger: true }))) return
    const r = await clientApi.deleteContract(cid)
    if (r.success) { toast('合同已删除', 'success'); onRefresh() }
    else toast(r.message || '删除失败', 'error')
  }

  return (
    <div style={embedded ? {} : { ...sectionStyle, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSignature size={18} color="var(--color-success)" />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-body)' }}>合同订单</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({contracts.length})</span>
        </div>
        <Button onClick={openAdd}><Plus size={14} /> 新建合同</Button>
      </div>
      {contracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无合同，点击"新建合同"开始</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contracts.map((c: any) => {
            const st = contractStatusMap[c.status] || contractStatusMap.draft
            return (
              <div key={c.id} style={{ border: '1px solid var(--border-primary)', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{c.title}</span>
                    <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span><DollarSign size={12} style={{ verticalAlign: -1 }} /> ¥{Number(c.amount || 0).toLocaleString()}</span>
                    {c.signed_date && <span>签约: {new Date(c.signed_date).toLocaleDateString('zh-CN')}</span>}
                    {c.expire_date && <span>到期: {new Date(c.expire_date).toLocaleDateString('zh-CN')}</span>}
                  </div>
                  {c.notes && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{c.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2, display: 'flex' }}><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2, display: 'flex' }}><X size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑合同' : '新建合同'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="合同标题 *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="金额 (¥)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>状态</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
              <option value="draft">草稿</option><option value="active">生效中</option><option value="expired">已到期</option><option value="terminated">已终止</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>签约日期</label>
              <input type="date" value={form.signed_date} onChange={e => setForm({ ...form, signed_date: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>到期日期</label>
              <input type="date" value={form.expire_date} onChange={e => setForm({ ...form, expire_date: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
            </div>
          </div>
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
