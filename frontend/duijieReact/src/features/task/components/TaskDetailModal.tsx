import { useState, useEffect, useRef } from 'react'
import { fetchApi, uploadFile, BACKEND_URL } from '../../../bootstrap'
import { taskApi } from '../services/api'
import Modal from '../../ui/Modal'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import { Paperclip, Download, Trash2, Upload, Calendar, User, Flag, AlignLeft, Loader2 } from 'lucide-react'
import { formatDateTime } from '../../../utils/datetime'
const fmtSize = (b: number) => b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'

const priorityOptions = [
  { value: 'low', label: '低', color: 'gray' },
  { value: 'medium', label: '中', color: 'blue' },
  { value: 'high', label: '高', color: 'yellow' },
  { value: 'urgent', label: '紧急', color: 'red' },
]

const statusOptions = [
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'pending_review', label: '待验收' },
  { value: 'accepted', label: '验收通过' },
]

const label: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }
const field: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', boxSizing: 'border-box' as const }

interface Props {
  task: any
  projectId: string
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function TaskDetailModal({ task, projectId, open, onClose, onUpdated }: Props) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assignee_id: '', due_date: '' })
  const [members, setMembers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        assignee_id: task.assignee_id ? String(task.assignee_id) : '',
        due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      })
      setNewFiles([])
    }
  }, [open, task])

  useEffect(() => {
    if (open && projectId) {
      fetchApi(`/api/users?limit=100`).then(r => {
        if (r.success) setMembers(r.data || [])
      })
    }
  }, [open, projectId])

  const handleSave = async () => {
    if (!form.title.trim()) { toast('标题不能为空', 'error'); return }
    setSaving(true)
    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      due_date: form.due_date || null,
    }
    const r = await taskApi.update(String(task.id), payload)
    if (newFiles.length > 0) {
      const fd = new FormData()
      fd.append('task_id', String(task.id))
      newFiles.forEach(f => fd.append('files', f))
      await uploadFile(`/api/tasks/${task.id}/attachments`, fd)
    }
    setSaving(false)
    if (r.success) { toast('任务已更新', 'success'); onUpdated(); onClose() }
    else toast(r.message || '更新失败', 'error')
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: '确认删除', message: '删除后无法恢复，确定要删除此任务吗？', danger: true })
    if (!ok) return
    setDeleting(true)
    const r = await taskApi.remove(String(task.id))
    setDeleting(false)
    if (r.success) { toast('任务已删除', 'success'); onUpdated(); onClose() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleDeleteAttachment = async (attId: number) => {
    const ok = await confirm({ title: '删除附件', message: '确定删除此附件？', danger: true })
    if (!ok) return
    const r = await fetchApi(`/api/tasks/attachments/${attId}`, { method: 'DELETE' })
    if (r.success) { toast('附件已删除', 'success'); onUpdated() }
    else toast(r.message || '删除失败', 'error')
  }

  if (!task) return null

  const attachments = task.attachments || []

  return (
    <Modal open={open} onClose={onClose} title="任务详情" width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div>
          <div style={label}><AlignLeft size={14} /> 标题</div>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={field} placeholder="任务标题" />
        </div>

        {/* Description */}
        <div>
          <div style={label}><AlignLeft size={14} /> 描述</div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3} placeholder="添加描述..."
            style={{ ...field, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        {/* Row: Status + Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={label}><Flag size={14} /> 状态</div>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={field}>
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <div style={label}><Flag size={14} /> 优先级</div>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={field}>
              {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Row: Assignee + Due date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={label}><User size={14} /> 指派人</div>
            <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })} style={field}>
              <option value="">未指派</option>
              {members.map((m: any) => <option key={m.id} value={m.id}>{m.nickname || m.username}</option>)}
            </select>
          </div>
          <div>
            <div style={label}><Calendar size={14} /> 截止日期</div>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={field} />
          </div>
        </div>

        {/* Attachments */}
        <div>
          <div style={{ ...label, marginBottom: 8 }}><Paperclip size={14} /> 附件 ({attachments.length + newFiles.length})</div>
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {attachments.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                  <Paperclip size={12} color="var(--text-secondary)" />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-body)' }}>{a.original_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{fmtSize(a.file_size || 0)}</span>
                  <a href={`${BACKEND_URL}/uploads/${a.filename}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', padding: 4, borderRadius: 4, color: 'var(--brand)' }} title="下载">
                    <Download size={14} />
                  </a>
                  <button onClick={() => handleDeleteAttachment(a.id)} title="删除"
                    style={{ display: 'flex', padding: 4, borderRadius: 4, border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {newFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {newFiles.map((f, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-selected)', border: '1px solid #bfdbfe', fontSize: 12, color: 'var(--brand)' }}>
                  <Upload size={10} /> {f.name}
                  <button onClick={() => setNewFiles(newFiles.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-tertiary)' }}>×</button>
                </span>
              ))}
            </div>
          )}
          <input ref={fileRef} type="file" multiple hidden onChange={e => { if (e.target.files) setNewFiles([...newFiles, ...Array.from(e.target.files)]); e.target.value = '' }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px dashed #cbd5e1', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <Upload size={14} /> 上传附件
          </button>
        </div>

        {/* Meta info */}
        {task.creator_name && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>创建人: {task.creator_name || task.creator_username}</span>
            {task.created_at && <span>创建时间: {formatDateTime(task.created_at)}</span>}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-secondary)' }}>
          <button onClick={handleDelete} disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 8, border: '1px solid #fecaca', background: 'var(--bg-primary)', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer' }}>
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 删除任务
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 13, cursor: 'pointer' }}>
            取消
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'var(--bg-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {saving && <Loader2 size={14} />} 保存
          </button>
        </div>
      </div>
    </Modal>
  )
}
