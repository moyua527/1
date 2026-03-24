import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Loader2, DollarSign, Calendar, User, Trash2, Edit3, X, TrendingUp } from 'lucide-react'
import { clientApi } from '../client/services/api'
import { can } from '../../stores/permissions'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

const stageMap: Record<string, { label: string; color: string; bg: string }> = {
  lead: { label: '线索', color: '#6b7280', bg: '#f3f4f6' },
  qualify: { label: '验证', color: '#2563eb', bg: '#dbeafe' },
  proposal: { label: '方案', color: '#7c3aed', bg: '#ede9fe' },
  negotiate: { label: '谈判', color: '#d97706', bg: '#fef3c7' },
  won: { label: '赢单', color: '#16a34a', bg: '#dcfce7' },
  lost: { label: '丢单', color: '#dc2626', bg: '#fee2e2' },
}
const stageKeys = ['lead', 'qualify', 'proposal', 'negotiate', 'won', 'lost']

export default function OpportunityList() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', client_id: '', amount: '', probability: '50', stage: 'lead', expected_close: '', assigned_to: '', notes: '' })
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const load = () => {
    setLoading(true)
    clientApi.opportunities().then(r => { if (r.success) setItems(r.data || []) }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => {
    setForm({ title: '', client_id: '', amount: '', probability: '50', stage: 'lead', expected_close: '', assigned_to: '', notes: '' })
    clientApi.list().then(r => { if (r.success) setClients(r.data || []) })
    clientApi.availableMembers().then(r => { if (r.success) setStaffMembers((r.data || []).filter((u: any) => can(u.role, 'staff:assignable'))) })
    setShowCreate(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      title: item.title || '', client_id: item.client_id ? String(item.client_id) : '', amount: item.amount ? String(item.amount) : '',
      probability: String(item.probability || 50), stage: item.stage || 'lead',
      expected_close: item.expected_close ? item.expected_close.slice(0, 10) : '', assigned_to: item.assigned_to ? String(item.assigned_to) : '', notes: item.notes || ''
    })
    clientApi.list().then(r => { if (r.success) setClients(r.data || []) })
    clientApi.availableMembers().then(r => { if (r.success) setStaffMembers((r.data || []).filter((u: any) => can(u.role, 'staff:assignable'))) })
    setShowEdit(true)
  }

  const handleCreate = async () => {
    if (!form.title.trim()) { toast('请输入商机标题', 'error'); return }
    setSubmitting(true)
    const r = await clientApi.createOpportunity({ ...form, amount: Number(form.amount) || 0, probability: Number(form.probability) || 50, client_id: form.client_id ? Number(form.client_id) : null, assigned_to: form.assigned_to ? Number(form.assigned_to) : null })
    setSubmitting(false)
    if (r.success) { toast('商机创建成功', 'success'); setShowCreate(false); load() }
    else toast(r.message || '创建失败', 'error')
  }

  const handleUpdate = async () => {
    if (!form.title.trim()) { toast('请输入商机标题', 'error'); return }
    setSubmitting(true)
    const r = await clientApi.updateOpportunity(editItem.id, { ...form, amount: Number(form.amount) || 0, probability: Number(form.probability) || 50, client_id: form.client_id ? Number(form.client_id) : null, assigned_to: form.assigned_to ? Number(form.assigned_to) : null })
    setSubmitting(false)
    if (r.success) { toast('商机已更新', 'success'); setShowEdit(false); load() }
    else toast(r.message || '更新失败', 'error')
  }

  const handleDelete = async (item: any) => {
    if (!(await confirm({ message: `确定删除商机"${item.title}"？`, danger: true }))) return
    const r = await clientApi.deleteOpportunity(item.id)
    if (r.success) { toast('商机已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleStageChange = async (item: any, newStage: string) => {
    const prev = items
    setItems(list => list.map(i => i.id === item.id ? { ...i, stage: newStage } : i))
    const r = await clientApi.updateOpportunity(item.id, { stage: newStage })
    if (!r.success) { setItems(prev); toast(r.message || '移动失败', 'error') }
  }

  const totalAmount = items.filter(i => i.stage !== 'lost').reduce((s, i) => s + Number(i.amount || 0), 0)
  const wonAmount = items.filter(i => i.stage === 'won').reduce((s, i) => s + Number(i.amount || 0), 0)

  const formFields = (
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
            {stageKeys.map(k => <option key={k} value={k}>{stageMap[k].label}</option>)}
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
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>商机管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>销售管道 · 共 {items.length} 个商机</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> 新建商机</Button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <DollarSign size={20} color="#7c3aed" />
          <div><div style={{ fontSize: 12, color: '#94a3b8' }}>管道总额</div><div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>¥{(totalAmount / 10000).toFixed(1)}万</div></div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="#16a34a" />
          <div><div style={{ fontSize: 12, color: '#94a3b8' }}>赢单金额</div><div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>¥{(wonAmount / 10000).toFixed(1)}万</div></div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="#d97706" />
          <div><div style={{ fontSize: 12, color: '#94a3b8' }}>赢单率</div><div style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>{items.filter(i => i.stage === 'won' || i.stage === 'lost').length > 0 ? ((items.filter(i => i.stage === 'won').length / items.filter(i => i.stage === 'won' || i.stage === 'lost').length) * 100).toFixed(0) : 0}%</div></div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <TrendingUp size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>暂无商机，点击右上角新建</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
          {stageKeys.map(stageKey => {
            const s = stageMap[stageKey]
            const stageItems = items.filter(i => (i.stage || 'lead') === stageKey)
            const stageTotal = stageItems.reduce((sum, i) => sum + Number(i.amount || 0), 0)
            return (
              <div key={stageKey}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stageKey) }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={e => { e.preventDefault(); setDragOverStage(null); const oid = e.dataTransfer.getData('opportunityId'); if (oid) { const item = items.find(i => String(i.id) === oid); if (item && item.stage !== stageKey) handleStageChange(item, stageKey) } }}
                style={{ minWidth: isMobile ? 260 : 280, flex: '1 0 auto', background: dragOverStage === stageKey ? '#eff6ff' : '#f8fafc', borderRadius: 12, padding: 12, border: dragOverStage === stageKey ? '2px dashed #2563eb' : '2px solid transparent', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', background: '#e2e8f0', padding: '1px 8px', borderRadius: 10 }}>{stageItems.length}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>¥{(stageTotal / 10000).toFixed(1)}万</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stageItems.map(item => (
                    <div key={item.id} draggable
                      onDragStart={e => e.dataTransfer.setData('opportunityId', String(item.id))}
                      style={{ background: '#fff', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', cursor: 'grab', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', flex: 1 }}>{item.title}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#64748b' }}><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#dc2626' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {item.client_name && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{item.client_name}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748b' }}>
                        {Number(item.amount) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><DollarSign size={12} /> ¥{Number(item.amount).toLocaleString()}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{item.probability}%</span>
                        {item.expected_close && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Calendar size={12} /> {item.expected_close.slice(0, 10)}</span>}
                      </div>
                      {item.assigned_name && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 6 }}><User size={11} /> {item.assigned_name}</div>}
                      {stageKey !== 'won' && stageKey !== 'lost' && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {stageKeys.filter(k => k !== stageKey && k !== 'lost').map(k => (
                            <button key={k} onClick={() => handleStageChange(item, k)}
                              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: `1px solid ${stageMap[k].color}20`, background: stageMap[k].bg, color: stageMap[k].color, cursor: 'pointer', fontWeight: 500 }}>
                              → {stageMap[k].label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建商机">
        {formFields}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
          <Button onClick={handleCreate} disabled={submitting}>{submitting ? '创建中...' : '创建'}</Button>
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="编辑商机">
        {formFields}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>取消</Button>
          <Button onClick={handleUpdate} disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button>
        </div>
      </Modal>
    </div>
  )
}
