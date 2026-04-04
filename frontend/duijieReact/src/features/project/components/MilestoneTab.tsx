import { useState } from 'react'
import { Plus, CheckCircle, Circle } from 'lucide-react'
import { milestoneApi } from '../../milestone/services/api'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface MilestoneTabProps {
  milestones: any[]
  projectId: string
  canEdit: boolean
  onRefresh: () => void
}

export default function MilestoneTab({ milestones, projectId, canEdit, onRefresh }: MilestoneTabProps) {
  const [showMsForm, setShowMsForm] = useState(false)
  const [editingMs, setEditingMs] = useState<any>(null)
  const [msForm, setMsForm] = useState({ title: '', description: '', due_date: '' })

  return (
    <div style={section}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>里程碑</h3>
        {canEdit && <Button onClick={() => { setEditingMs(null); setMsForm({ title: '', description: '', due_date: '' }); setShowMsForm(!showMsForm) }}><Plus size={14} /> 新增</Button>}
      </div>
      {showMsForm && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>标题</label>
              <input value={msForm.title} onChange={e => setMsForm({ ...msForm, title: e.target.value })} placeholder="里程碑标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>达到日期</label>
              <input type="date" value={msForm.due_date} onChange={e => setMsForm({ ...msForm, due_date: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <textarea value={msForm.description} onChange={e => setMsForm({ ...msForm, description: e.target.value })}
            placeholder="描述（可选）" rows={2}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setShowMsForm(false); setEditingMs(null) }}>取消</Button>
            <Button onClick={async () => {
              if (!msForm.title.trim()) { toast('请输入标题', 'error'); return }
              const r = editingMs
                ? await milestoneApi.update(String(editingMs.id), msForm)
                : await milestoneApi.create({ project_id: Number(projectId), ...msForm })
              if (r.success) { toast(editingMs ? '里程碑已更新' : '里程碑已创建', 'success'); if (!editingMs) window.dispatchEvent(new CustomEvent('onboarding-done', { detail: { type: 'set_milestone' } })); setShowMsForm(false); setEditingMs(null); setMsForm({ title: '', description: '', due_date: '' }); onRefresh() }
              else toast(r.message || '操作失败', 'error')
            }}>{editingMs ? '保存修改' : '创建'}</Button>
          </div>
        </div>
      )}
      {milestones.length === 0 ? <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>暂无里程碑</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {milestones.map((m: any) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ cursor: canEdit ? 'pointer' : 'default' }}
                onClick={canEdit ? async () => { await milestoneApi.toggle(String(m.id)); onRefresh() } : undefined}>
                {m.is_completed ? <CheckCircle size={20} color="var(--color-success)" /> : <Circle size={20} color="#94a3b8" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: m.is_completed ? 'var(--text-tertiary)' : 'var(--text-heading)', textDecoration: m.is_completed ? 'line-through' : 'none' }}>{m.title}</div>
                {m.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{m.description}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {m.due_date && <span style={{ fontSize: 11, color: new Date(m.due_date) < new Date() && !m.is_completed ? 'var(--color-danger)' : 'var(--text-tertiary)' }}>达到日期: {m.due_date.slice(0, 10)}</span>}
                  {m.completed_at && <span style={{ fontSize: 11, color: 'var(--color-success)' }}>已完成</span>}
                </div>
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditingMs(m); setMsForm({ title: m.title || '', description: m.description || '', due_date: m.due_date ? m.due_date.slice(0, 10) : '' }); setShowMsForm(true) }}
                    style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>编辑</button>
                  <button onClick={async () => { const r = await milestoneApi.remove(String(m.id)); if (r.success) { toast('已删除', 'success'); onRefresh() } else toast(r.message || '删除失败', 'error') }}
                    style={{ fontSize: 11, color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>删除</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
