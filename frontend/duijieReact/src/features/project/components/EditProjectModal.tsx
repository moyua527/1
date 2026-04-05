import { useState, useEffect } from 'react'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

interface Props {
  open: boolean
  project: any
  onClose: () => void
  onSave: (data: { name: string; description: string; status: string; task_title_presets: string[] }) => Promise<boolean>
}

export default function EditProjectModal({ open, project, onClose, onSave }: Props) {
  const [form, setForm] = useState({ name: '', description: '', status: 'planning', task_title_presets: [] as string[], newPreset: '' })

  useEffect(() => {
    if (open && project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        task_title_presets: Array.isArray(project.task_title_presets) ? [...project.task_title_presets] : [],
        newPreset: '',
      })
    }
  }, [open, project])

  const addPreset = () => {
    const v = form.newPreset.trim()
    if (v && !form.task_title_presets.includes(v)) setForm(f => ({ ...f, task_title_presets: [...f.task_title_presets, v], newPreset: '' }))
  }

  return (
    <Modal open={open} onClose={onClose} title="编辑项目">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>项目名称</label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="项目名称" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>描述</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="项目描述（可选）" rows={3}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14, resize: 'vertical' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>固定功能名称</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={form.newPreset} onChange={e => setForm(f => ({ ...f, newPreset: e.target.value }))}
              placeholder="输入功能名称" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPreset() } }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14 }} />
            <Button variant="secondary" onClick={addPreset}>添加</Button>
          </div>
          {form.task_title_presets.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.task_title_presets.map((p, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-tertiary)', fontSize: 13, color: 'var(--text-body)' }}>
                  {p}
                  <button type="button" onClick={() => setForm(f => ({ ...f, task_title_presets: f.task_title_presets.filter((_, j) => j !== i) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>需求创建时可直接下拉选择这些固定功能名称</div>
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>状态</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14 }}>
            {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={async () => {
            if (!form.name.trim()) { toast('请输入项目名称', 'error'); return }
            const ok = await onSave({ name: form.name.trim(), description: form.description.trim(), status: form.status, task_title_presets: form.task_title_presets })
            if (ok) onClose()
          }}>保存</Button>
        </div>
      </div>
    </Modal>
  )
}
