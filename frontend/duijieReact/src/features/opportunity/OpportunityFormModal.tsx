import { useState, useEffect } from 'react'
import { clientApi } from '../client/services/api'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'

const stageKeys = ['lead', 'qualify', 'proposal', 'negotiate', 'won', 'lost']
const stageLabels: Record<string, string> = {
  lead: '线索', qualify: '验证', proposal: '方案', negotiate: '谈判', won: '赢单', lost: '丢单',
}

const defaultForm = { title: '', client_id: '', amount: '', probability: '50', stage: 'lead', expected_close: '', assigned_to: '', notes: '' }

interface OpportunityFormModalProps {
  open: boolean
  onClose: () => void
  editing: any | null
  clients: any[]
  staffMembers: any[]
  onSaved: () => void
}

export default function OpportunityFormModal({ open, onClose, editing, clients, staffMembers, onSaved }: OpportunityFormModalProps) {
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        title: editing.title || '', client_id: editing.client_id ? String(editing.client_id) : '', amount: editing.amount ? String(editing.amount) : '',
        probability: String(editing.probability || 50), stage: editing.stage || 'lead',
        expected_close: editing.expected_close ? editing.expected_close.slice(0, 10) : '', assigned_to: editing.assigned_to ? String(editing.assigned_to) : '', notes: editing.notes || ''
      })
    } else {
      setForm(defaultForm)
    }
  }, [open, editing])

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast('请输入商机标题', 'error'); return }
    setSubmitting(true)
    const payload = { ...form, amount: Number(form.amount) || 0, probability: Number(form.probability) || 50, client_id: form.client_id ? Number(form.client_id) : null, assigned_to: form.assigned_to ? Number(form.assigned_to) : null }
    const r = editing
      ? await clientApi.updateOpportunity(editing.id, payload)
      : await clientApi.createOpportunity(payload)
    setSubmitting(false)
    if (r.success) {
      toast(editing ? '商机已更新' : '商机创建成功', 'success')
      onClose()
      onSaved()
    } else {
      toast(r.message || (editing ? '更新失败' : '创建失败'), 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? '编辑商机' : '新建商机'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="商机标题 *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>关联客户</label>
          <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
            <option value="">不关联</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>#{c.id} {c.name}{c.company ? ` (${c.company})` : ''}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="预计金额 (¥)" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <Input label="成交概率 (%)" type="number" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>商机阶段</label>
            <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              {stageKeys.map(k => <option key={k} value={k}>{stageLabels[k]}</option>)}
            </select>
          </div>
          <Input label="预计成交日期" type="date" value={form.expected_close} onChange={e => setForm({ ...form, expected_close: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>负责人</label>
          <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
            <option value="">暂不分配</option>
            {staffMembers.map((u: any) => <option key={u.id} value={u.id}>{u.nickname || u.username}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="secondary" onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (editing ? '保存中...' : '创建中...') : (editing ? '保存' : '创建')}
        </Button>
      </div>
    </Modal>
  )
}
