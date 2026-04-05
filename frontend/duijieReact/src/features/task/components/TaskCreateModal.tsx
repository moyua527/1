import { useState, useEffect, useRef, useCallback, DragEvent, ClipboardEvent } from 'react'
import { fetchApi, uploadFile } from '../../../bootstrap'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { Paperclip, X, Upload } from 'lucide-react'
import TaskTitleSelector from './TaskTitleSelector'
import { projectApi } from '../../project/services/api'

const columns = [
  { key: 'submitted', label: '已提出' },
  { key: 'disputed', label: '待补充' },
  { key: 'in_progress', label: '执行中' },
  { key: 'pending_review', label: '待验收' },
  { key: 'review_failed', label: '验收不通过' },
  { key: 'accepted', label: '验收通过' },
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  projects: any[]
}

const emptyCreateForm = {
  project_id: '',
  title: '',
  description: '',
  priority: 'medium',
  status: 'submitted',
  assignee_id: '',
  due_date: '',
}

export default function TaskCreateModal({ open, onClose, onCreated, projects }: Props) {
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createMembers, setCreateMembers] = useState<any[]>([])
  const [createFiles, setCreateFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const defaultProjectId = projects[0]?.id ? String(projects[0].id) : ''
  const currentProjectId = createForm.project_id || defaultProjectId

  const resetCreateState = useCallback(() => {
    setCreateForm(emptyCreateForm)
    setCreateMembers([])
    setCreateFiles([])
  }, [])

  const handleClose = useCallback(() => {
    resetCreateState()
    onClose()
  }, [onClose, resetCreateState])

  const addFiles = useCallback((files: FileList | File[]) => {
    setCreateFiles(prev => [...prev, ...Array.from(files)])
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const f = items[i].getAsFile()
        if (f) files.push(f)
      }
    }
    if (files.length) { e.preventDefault(); e.stopPropagation(); addFiles(files) }
  }, [addFiles])

  useEffect(() => {
    if (!open) return
    const onPaste = (e: Event) => {
      const ce = e as globalThis.ClipboardEvent
      const items = ce.clipboardData?.items; if (!items) return
      const files: File[] = []
      for (let i = 0; i < items.length; i++) { if (items[i].kind === 'file') { const f = items[i].getAsFile(); if (f) files.push(f) } }
      if (files.length) { ce.preventDefault(); addFiles(files) }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [open, addFiles])

  useEffect(() => {
    if (!currentProjectId) return
    let active = true
    fetchApi(`/api/projects/${currentProjectId}`).then(r => {
      if (!active) return
      if (r.success && r.data?.members) setCreateMembers(r.data.members)
    })
    return () => {
      active = false
    }
  }, [currentProjectId])

  const handleCreate = async () => {
    if (!currentProjectId) { toast('请选择项目', 'error'); return }
    const title = createForm.title.trim()
    if (!title) { toast('请输入需求标题', 'error'); return }
    setSubmitting(true)
    const fd = new FormData()
    fd.append('project_id', currentProjectId)
    fd.append('title', title)
    if (createForm.description) fd.append('description', createForm.description)
    fd.append('priority', createForm.priority)
    fd.append('status', createForm.status)
    if (createForm.assignee_id) fd.append('assignee_id', createForm.assignee_id)
    if (createForm.due_date) fd.append('due_date', createForm.due_date)
    createFiles.forEach(f => fd.append('files', f))
    const r = await uploadFile('/api/tasks', fd)
    setSubmitting(false)
    if (r.success) {
      const rememberResult = await projectApi.rememberTaskTitle(currentProjectId, title)
      if (!rememberResult.success) toast(rememberResult.message || '需求标题历史保存失败', 'error')
      toast('需求已创建', 'success')
      handleClose()
      onCreated()
    } else toast(r.message || '创建失败', 'error')
  }

  return (
    <Modal open={open} onClose={handleClose} title="新建需求">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>所属项目 *</label>
          <select value={currentProjectId} onChange={e => { setCreateMembers([]); setCreateForm({ ...createForm, project_id: e.target.value }) }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">请选择项目</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <TaskTitleSelector key={`task-title-${open ? 'open' : 'closed'}-${currentProjectId || 'none'}`} label="需求标题" open={open} projectId={currentProjectId} value={createForm.title} onChange={title => setCreateForm({ ...createForm, title })} required />
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>描述</label>
          <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="需求描述（可选）"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>优先级</label>
            <select value={createForm.priority} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>初始状态</label>
            <select value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
              {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>指派人</label>
            <select value={createForm.assignee_id} onChange={e => setCreateForm({ ...createForm, assignee_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
              <option value="">未指派</option>
              {createMembers.map((m: any) => <option key={m.id} value={m.id}>{m.nickname || m.username}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>截止日期</label>
            <input type="date" value={createForm.due_date} onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>附件（文件/图片）</label>
          <input ref={fileRef} type="file" multiple hidden onChange={e => { if (e.target.files) addFiles(e.target.files); if (fileRef.current) fileRef.current.value = '' }} />
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', padding: '20px 0', border: `2px dashed ${isDragging ? 'var(--brand)' : '#cbd5e1'}`,
              borderRadius: 8, background: isDragging ? 'var(--bg-selected)' : 'var(--bg-secondary)', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
            }}>
            <Upload size={20} color={isDragging ? 'var(--brand)' : '#94a3b8'} />
            <span>{isDragging ? '松开即可添加文件' : '点击选择、拖入文件 或 Ctrl+V 粘贴'}</span>
          </div>
          {createFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {createFiles.map((f, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-selected)', border: '1px solid #bfdbfe', fontSize: 11, color: 'var(--brand)' }}>
                  <Paperclip size={10} /> {f.name}
                  <button onClick={() => setCreateFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={10} color="#94a3b8" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={handleClose}>取消</Button>
          <Button disabled={submitting} onClick={handleCreate}>{submitting ? '创建中...' : '创建需求'}</Button>
        </div>
      </div>
    </Modal>
  )
}
