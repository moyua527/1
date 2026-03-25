import { useState, useEffect, useRef } from 'react'
import { fetchApi, uploadFile } from '../../../bootstrap'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { Paperclip, X } from 'lucide-react'

const columns = [
  { key: 'todo', label: '待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'pending_review', label: '待验收' },
  { key: 'accepted', label: '验收通过' },
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  projects: any[]
}

export default function TaskCreateModal({ open, onClose, onCreated, projects }: Props) {
  const [createForm, setCreateForm] = useState({ project_id: '', title: '', description: '', priority: 'medium', status: 'todo', assignee_id: '', due_date: '' })
  const [createMembers, setCreateMembers] = useState<any[]>([])
  const [createFiles, setCreateFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCreateForm({ project_id: projects[0]?.id ? String(projects[0].id) : '', title: '', description: '', priority: 'medium', status: 'todo', assignee_id: '', due_date: '' })
      setCreateFiles([])
    }
  }, [open, projects])

  useEffect(() => {
    if (createForm.project_id) {
      fetchApi(`/api/projects/${createForm.project_id}`).then(r => { if (r.success && r.data?.members) setCreateMembers(r.data.members) })
    } else setCreateMembers([])
  }, [createForm.project_id])

  const handleCreate = async () => {
    if (!createForm.project_id) { toast('请选择项目', 'error'); return }
    if (!createForm.title.trim()) { toast('请输入任务标题', 'error'); return }
    setSubmitting(true)
    const fd = new FormData()
    fd.append('project_id', createForm.project_id)
    fd.append('title', createForm.title.trim())
    if (createForm.description) fd.append('description', createForm.description)
    fd.append('priority', createForm.priority)
    fd.append('status', createForm.status)
    if (createForm.assignee_id) fd.append('assignee_id', createForm.assignee_id)
    if (createForm.due_date) fd.append('due_date', createForm.due_date)
    createFiles.forEach(f => fd.append('files', f))
    const r = await uploadFile('/api/tasks', fd)
    setSubmitting(false)
    if (r.success) {
      toast('任务已创建', 'success')
      onClose()
      setCreateForm({ project_id: '', title: '', description: '', priority: 'medium', status: 'todo', assignee_id: '', due_date: '' })
      setCreateFiles([])
      onCreated()
    } else toast(r.message || '创建失败', 'error')
  }

  return (
    <Modal open={open} onClose={onClose} title="新建任务">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>所属项目 *</label>
          <select value={createForm.project_id} onChange={e => setCreateForm({ ...createForm, project_id: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
            <option value="">请选择项目</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Input label="任务标题 *" placeholder="输入任务标题" value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} />
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>描述</label>
          <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="任务描述（可选）"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>优先级</label>
            <select value={createForm.priority} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>初始状态</label>
            <select value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>指派人</label>
            <select value={createForm.assignee_id} onChange={e => setCreateForm({ ...createForm, assignee_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">未指派</option>
              {createMembers.map((m: any) => <option key={m.id} value={m.id}>{m.nickname || m.username}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>截止日期</label>
            <input type="date" value={createForm.due_date} onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>附件</label>
          <input ref={fileRef} type="file" multiple hidden onChange={e => { if (e.target.files) setCreateFiles(prev => [...prev, ...Array.from(e.target.files!)]); if (fileRef.current) fileRef.current.value = '' }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ width: '100%', padding: '8px 0', border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Paperclip size={14} /> 点击选择文件
          </button>
          {createFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {createFiles.map((f, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, color: '#1e40af' }}>
                  <Paperclip size={10} /> {f.name}
                  <button onClick={() => setCreateFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={10} color="#94a3b8" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button disabled={submitting} onClick={handleCreate}>{submitting ? '创建中...' : '创建任务'}</Button>
        </div>
      </div>
    </Modal>
  )
}
