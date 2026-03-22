import { useState, useEffect } from 'react'
import { Plus, CheckCircle, Circle, Edit3, Trash2, Calendar, AlertTriangle, Target } from 'lucide-react'
import { milestoneApi } from '../services/api'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'

interface Props { projectId: string; canEdit?: boolean }

const isOverdue = (d: string) => !!(d && new Date(d) < new Date(new Date().toDateString()))

export default function MilestoneList({ projectId, canEdit = true }: Props) {
  const [milestones, setMilestones] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', description: '', due_date: '' })

  const load = () => { milestoneApi.list(projectId).then(r => { if (r.success) setMilestones(r.data || []) }) }
  useEffect(load, [projectId])

  const completed = milestones.filter(m => m.is_completed).length
  const total = milestones.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const openCreate = () => { setEditingId(null); setForm({ title: '', description: '', due_date: '' }); setShowForm(true) }
  const openEdit = (m: any) => { setEditingId(m.id); setForm({ title: m.title || '', description: m.description || '', due_date: m.due_date ? m.due_date.slice(0, 10) : '' }); setShowForm(true) }

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast('请输入标题', 'error'); return }
    if (editingId) {
      const r = await milestoneApi.update(String(editingId), { title: form.title.trim(), description: form.description.trim() || undefined, due_date: form.due_date || undefined })
      if (r.success) toast('已更新', 'success'); else toast(r.message || '更新失败', 'error')
    } else {
      const r = await milestoneApi.create({ project_id: Number(projectId), title: form.title.trim(), description: form.description.trim() || undefined, due_date: form.due_date || undefined })
      if (r.success) toast('已创建', 'success'); else toast(r.message || '创建失败', 'error')
    }
    setShowForm(false)
    load()
  }

  const handleDelete = async (m: any) => {
    const ok = await confirm({ message: `确定删除里程碑「${m.title}」？`, danger: true })
    if (!ok) return
    const r = await milestoneApi.remove(String(m.id))
    if (r.success) { toast('已删除', 'success'); load() } else toast(r.message || '删除失败', 'error')
  }

  const handleToggle = async (id: string) => {
    await milestoneApi.toggle(id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>里程碑</h3>
          {total > 0 && (
            <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', borderRadius: 10, padding: '2px 10px' }}>
              {completed}/{total} 完成 ({progress}%)
            </span>
          )}
        </div>
        {canEdit && <Button onClick={openCreate}><Plus size={14} /> 新建</Button>}
      </div>

      {total > 0 && (
        <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#16a34a' : '#2563eb', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      )}

      {milestones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
          <Target size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
          <div style={{ fontSize: 14 }}>暂无里程碑</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {milestones.map((m: any) => {
            const overdue = !m.is_completed && isOverdue(m.due_date)
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: m.is_completed ? '#f0fdf4' : overdue ? '#fef2f2' : '#f8fafc', borderRadius: 10, border: `1px solid ${m.is_completed ? '#bbf7d0' : overdue ? '#fecaca' : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                <div style={{ cursor: 'pointer', marginTop: 2, flexShrink: 0 }} onClick={() => handleToggle(String(m.id))}>
                  {m.is_completed ? <CheckCircle size={20} color="#16a34a" /> : <Circle size={20} color={overdue ? '#dc2626' : '#94a3b8'} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: m.is_completed ? '#16a34a' : '#0f172a', textDecoration: m.is_completed ? 'line-through' : 'none' }}>{m.title}</div>
                  {m.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {m.due_date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: overdue ? '#dc2626' : '#94a3b8' }}>
                        {overdue && <AlertTriangle size={10} />}
                        <Calendar size={10} /> 截止 {m.due_date.slice(0, 10)}
                      </span>
                    )}
                    {m.completed_at && <span style={{ fontSize: 11, color: '#16a34a' }}>完成于 {new Date(m.completed_at).toLocaleDateString('zh-CN')}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginTop: 2 }}>
                    <button onClick={() => openEdit(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')} onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? '编辑里程碑' : '新建里程碑'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="标题 *" placeholder="里程碑名称" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="里程碑描述（可选）"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <Input label="截止日期" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingId ? '保存' : '创建'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
