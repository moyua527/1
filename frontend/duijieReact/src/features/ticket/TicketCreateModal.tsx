import { useState, useRef, useCallback, DragEvent, ClipboardEvent } from 'react'
import { Paperclip, X, Upload } from 'lucide-react'
import { fetchApi, uploadFile } from '../../bootstrap'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'

const fmtSize = (b: number) => b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'

interface Props { open: boolean; onClose: () => void; onCreated: () => void }

export default function TicketCreateModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ title: '', content: '', type: 'question', priority: 'medium', project_id: '' })
  const [projects, setProjects] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [inited, setInited] = useState(false)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles(prev => [...prev, ...Array.from(newFiles)])
  }, [])
  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }, [addFiles])
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items; if (!items) return
    const pastedFiles: File[] = []
    for (let i = 0; i < items.length; i++) { if (items[i].kind === 'file') { const f = items[i].getAsFile(); if (f) pastedFiles.push(f) } }
    if (pastedFiles.length) { e.preventDefault(); addFiles(pastedFiles) }
  }, [addFiles])

  if (open && !inited) {
    setForm({ title: '', content: '', type: 'question', priority: 'medium', project_id: '' })
    setFiles([])
    fetchApi('/api/projects').then(r => { if (r.success) setProjects(r.data?.rows || r.data || []) })
    setInited(true)
  }
  if (!open && inited) setInited(false)

  const handleCreate = async () => {
    if (!form.title.trim()) { toast('标题必填', 'error'); return }
    const fd = new FormData()
    fd.append('title', form.title); fd.append('content', form.content)
    fd.append('type', form.type); fd.append('priority', form.priority)
    if (form.project_id) fd.append('project_id', form.project_id)
    files.forEach(f => fd.append('files', f))
    const r = await uploadFile('/api/tickets', fd)
    if (r.success) { toast('工单已提交', 'success'); onClose(); onCreated() }
    else toast(r.message || '提交失败', 'error')
  }

  return (
    <Modal open={open} onClose={onClose} title="新建工单">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="标题" placeholder="简要描述您的需求或问题" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 6 }}>详细描述</div>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="请详细描述..." rows={4}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 6 }}>类型</div>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none' }}>
              <option value="question">咨询</option><option value="requirement">需求</option><option value="bug">问题</option><option value="other">其他</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 6 }}>优先级</div>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none' }}>
              <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option>
            </select>
          </div>
        </div>
        {projects.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 6 }}>关联项目（选填）</div>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none' }}>
              <option value="">不关联</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 6 }}>附件（选填）</div>
          <input ref={fileRef} type="file" multiple hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
          <div
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
          {files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {files.map((f, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-selected)', border: '1px solid #bfdbfe', fontSize: 12, color: 'var(--brand)' }}>
                  <Paperclip size={12} /> {f.name} ({fmtSize(f.size)})
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} color="#94a3b8" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-primary)' }}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleCreate}>提交工单</Button>
        </div>
      </div>
    </Modal>
  )
}
