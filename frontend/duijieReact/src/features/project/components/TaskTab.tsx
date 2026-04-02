import { useState, useEffect, useRef, useCallback, DragEvent, ClipboardEvent } from 'react'
import { ChevronDown, Plus, Trash2, Upload, FileText, Image, X, Paperclip, Download } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Badge from '../../ui/Badge'
import Input from '../../ui/Input'
import { taskApi } from '../../task/services/api'
import { toast } from '../../ui/Toast'

const taskStatusMap: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: 'gray' },
  in_progress: { label: '进行中', color: 'yellow' },
  pending_review: { label: '待验收', color: 'blue' },
  accepted: { label: '验收通过', color: 'green' },
}

const ALL_STATUSES = ['todo', 'in_progress', 'pending_review', 'accepted'] as const

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface TaskTabProps {
  tasks: any[]
  canEdit: boolean
  projectId: string
  loadTasks: () => void
}

export default function TaskTab({ tasks, canEdit, projectId, loadTasks }: TaskTabProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showDeleteTask, setShowDeleteTask] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' })
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const [deleteSelected, setDeleteSelected] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const addTaskFiles = useCallback((newFiles: FileList | File[]) => {
    setTaskFiles(prev => [...prev, ...Array.from(newFiles)])
  }, [])

  const handleFileDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }, [])
  const handleFileDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }, [])
  const handleFileDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    if (e.dataTransfer.files?.length) addTaskFiles(e.dataTransfer.files)
  }, [addTaskFiles])
  const handleFilePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items; if (!items) return
    const pastedFiles: File[] = []
    for (let i = 0; i < items.length; i++) { if (items[i].kind === 'file') { const f = items[i].getAsFile(); if (f) pastedFiles.push(f) } }
    if (pastedFiles.length) { e.preventDefault(); addTaskFiles(pastedFiles) }
  }, [addTaskFiles])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!showCreateTask) return
    const onPaste = (e: Event) => {
      const ce = e as globalThis.ClipboardEvent
      const items = ce.clipboardData?.items; if (!items) return
      const pastedFiles: File[] = []
      for (let i = 0; i < items.length; i++) { if (items[i].kind === 'file') { const f = items[i].getAsFile(); if (f) pastedFiles.push(f) } }
      if (pastedFiles.length) { ce.preventDefault(); addTaskFiles(pastedFiles) }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [showCreateTask, addTaskFiles])

  return (
    <>
      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>任务列表</h3>
          {canEdit && <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: 'var(--brand)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}>操作 <ChevronDown size={14} /></button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', minWidth: 120, zIndex: 10, overflow: 'hidden' }}>
                <button onClick={() => { setDropdownOpen(false); setShowCreateTask(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-body)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Plus size={14} color="var(--brand)" /> 添加任务
                </button>
                <button onClick={() => { setDropdownOpen(false); setDeleteSelected(new Set()); setShowDeleteTask(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-danger)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Trash2 size={14} /> 删除任务
                </button>
              </div>
            )}
          </div>}
        </div>
        {tasks.length === 0 ? <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>暂无任务</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map((t: any) => {
              const ts = taskStatusMap[t.status] || taskStatusMap.todo
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{t.description}</div>}
                    {t.created_at && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>创建: {new Date(t.created_at).toLocaleDateString('zh-CN')}</div>}
                    {t.due_date && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>截止: {t.due_date}</div>}
                    {t.attachments && t.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {t.attachments.map((a: any) => {
                          const isImage = a.mime_type?.startsWith('image/')
                          const url = `/api/tasks/attachments/${a.id}/download`
                          if (isImage) {
                            return (
                              <div key={a.id} onClick={() => setPreviewImg(url)} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-primary)', width: 80, height: 80, flexShrink: 0 }}>
                                <img src={url} alt={a.original_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )
                          }
                          return (
                            <a key={a.id} href={url} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'var(--bg-selected)', borderRadius: 6, fontSize: 12, color: 'var(--brand)', textDecoration: 'none', border: '1px solid #dbeafe' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-light-2)' }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-selected)' }}>
                              <Paperclip size={12} />
                              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.original_name}</span>
                              <Download size={10} />
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <select value={t.status} disabled={!canEdit} onChange={async (e) => {
                    const r = await taskApi.move(String(t.id), e.target.value)
                    if (r.success) loadTasks()
                    else toast(r.message || '状态切换失败', 'error')
                  }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, color: 'var(--text-body)', cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.6 }}>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{taskStatusMap[s].label}</option>
                    ))}
                  </select>
                  <Badge color={ts.color}>{ts.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showCreateTask} onClose={() => { setShowCreateTask(false); setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' }); setTaskFiles([]) }} title="添加任务">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="任务标题" placeholder="输入任务标题" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>任务描述</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="描述任务内容..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }} />
          </div>
          <Input label="截止日期" type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>优先级</label>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>附件（文件/图片）</label>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => {
              if (e.target.files) addTaskFiles(e.target.files)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }} />
            <div
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
              onPaste={handleFilePaste}
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: '20px 0', border: `2px dashed ${isDragging ? 'var(--brand)' : '#cbd5e1'}`,
                borderRadius: 8, background: isDragging ? 'var(--bg-selected)' : 'var(--bg-secondary)', cursor: 'pointer',
                fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
              }}>
              <Upload size={20} color={isDragging ? 'var(--brand)' : '#94a3b8'} />
              <span>{isDragging ? '松开即可添加文件' : '点击选择、拖入文件 或 Ctrl+V 粘贴'}</span>
            </div>
            {taskFiles.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {taskFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 13 }}>
                    {f.type.startsWith('image/') ? <Image size={14} color="var(--brand)" /> : <FileText size={14} color="var(--text-secondary)" />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-body)' }}>{f.name}</span>
                    <button onClick={() => setTaskFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, display: 'flex' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => { setShowCreateTask(false); setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' }); setTaskFiles([]) }}>取消</Button>
            <Button disabled={submitting} onClick={async () => {
              if (!taskForm.title.trim()) { toast('请输入任务标题', 'error'); return }
              setSubmitting(true)
              const r = await taskApi.create({ project_id: Number(projectId), title: taskForm.title, description: taskForm.description, due_date: taskForm.due_date || undefined, priority: taskForm.priority }, taskFiles.length > 0 ? taskFiles : undefined)
              if (r.success) {
                toast('任务创建成功', 'success')
                setShowCreateTask(false)
                setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' })
                setTaskFiles([])
                loadTasks()
              } else toast(r.message || '创建失败', 'error')
              setSubmitting(false)
            }}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteTask} onClose={() => setShowDeleteTask(false)} title="删除任务">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.length === 0 ? <div style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 20 }}>暂无任务可删除</div> : (<>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>选择要删除的任务：</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
              {tasks.map((t: any) => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: deleteSelected.has(t.id) ? '#fef2f2' : 'var(--bg-secondary)', borderRadius: 8, cursor: 'pointer', border: deleteSelected.has(t.id) ? '1px solid #fca5a5' : '1px solid transparent' }}>
                  <input type="checkbox" checked={deleteSelected.has(t.id)} onChange={() => {
                    setDeleteSelected(prev => { const n = new Set(prev); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n })
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{t.title}</div>
                    {t.due_date && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>截止: {t.due_date}</div>}
                  </div>
                  <Badge color={(taskStatusMap[t.status] || taskStatusMap.todo).color}>{(taskStatusMap[t.status] || taskStatusMap.todo).label}</Badge>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>已选 {deleteSelected.size} 项</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={() => setShowDeleteTask(false)}>取消</Button>
                <Button variant="danger" disabled={deleteSelected.size === 0 || submitting} onClick={async () => {
                  setSubmitting(true)
                  for (const tid of deleteSelected) await taskApi.remove(String(tid))
                  toast(`已删除 ${deleteSelected.size} 个任务`, 'success')
                  setShowDeleteTask(false)
                  setDeleteSelected(new Set())
                  loadTasks()
                  setSubmitting(false)
                }}>{submitting ? '删除中...' : `删除 (${deleteSelected.size})`}</Button>
              </div>
            </div>
          </>)}
        </div>
      </Modal>

      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', padding: 24 }}>
          <img src={previewImg} alt="预览" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setPreviewImg(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>✕</button>
        </div>
      )}
    </>
  )
}
