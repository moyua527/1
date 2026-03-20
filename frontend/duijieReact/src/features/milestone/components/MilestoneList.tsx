import { useState, useEffect } from 'react'
import { Plus, CheckCircle, Circle } from 'lucide-react'
import { milestoneApi } from '../services/api'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'

interface Props { projectId: string }

export default function MilestoneList({ projectId }: Props) {
  const [milestones, setMilestones] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', due_date: '' })

  const load = () => { milestoneApi.list(projectId).then(r => { if (r.success) setMilestones(r.data || []) }) }
  useEffect(load, [projectId])

  const handleCreate = async () => {
    if (!form.title) return
    await milestoneApi.create({ project_id: Number(projectId), title: form.title, due_date: form.due_date || undefined })
    setShowCreate(false)
    setForm({ title: '', due_date: '' })
    load()
  }

  const handleToggle = async (id: string) => {
    await milestoneApi.toggle(id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>里程碑</h3>
        <Button onClick={() => setShowCreate(true)}><Plus size={14} /> 新建</Button>
      </div>
      {milestones.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无里程碑</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {milestones.map((m: any) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer' }} onClick={() => handleToggle(String(m.id))}>
              {m.is_completed ? <CheckCircle size={20} color="#16a34a" /> : <Circle size={20} color="#94a3b8" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: m.is_completed ? '#94a3b8' : '#0f172a', textDecoration: m.is_completed ? 'line-through' : 'none' }}>{m.title}</div>
                {m.due_date && <div style={{ fontSize: 12, color: '#94a3b8' }}>截止: {m.due_date}</div>}
              </div>
              {m.completed_at && <div style={{ fontSize: 11, color: '#16a34a' }}>已完成</div>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建里程碑">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="标题" placeholder="里程碑名称" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="截止日期" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
