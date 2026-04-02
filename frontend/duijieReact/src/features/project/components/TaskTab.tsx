import { useState, useRef, useCallback, DragEvent, ClipboardEvent } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, FileText, Image, X, Paperclip, Download, Send } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Badge from '../../ui/Badge'
import { taskApi } from '../../task/services/api'
import { toast } from '../../ui/Toast'
import { formatDateTime } from '../../../utils/datetime'

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
  const [showDeleteTask, setShowDeleteTask] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' })
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const [deleteSelected, setDeleteSelected] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmitTask = async () => {
    if (!taskForm.title.trim()) { toast('请输入任务标题', 'error'); chatInputRef.current?.focus(); return }
    setSubmitting(true)
    const r = await taskApi.create({ project_id: Number(projectId), title: taskForm.title, description: taskForm.description, due_date: taskForm.due_date || undefined, priority: taskForm.priority }, taskFiles.length > 0 ? taskFiles : undefined)
    if (r.success) {
      toast('任务创建成功', 'success')
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' })
      setTaskFiles([])
      setShowExtra(false)
      loadTasks()
      setTimeout(() => chatInputRef.current?.focus(), 100)
    } else toast(r.message || '创建失败', 'error')
    setSubmitting(false)
  }

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

  return (
    <>
      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>任务列表</h3>
          {canEdit && <div style={{ position: 'relative' }}>
            <button onClick={() => { setDeleteSelected(new Set()); setShowDeleteTask(true) }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
              background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', cursor: 'pointer', fontSize: 13,
            }}><Trash2 size={13} /> 删除</button>
          </div>}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[{ key: '', label: '全部' }, ...ALL_STATUSES.map(s => ({ key: s, label: taskStatusMap[s].label }))].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: statusFilter === f.key ? 'var(--brand)' : 'var(--bg-tertiary)',
                color: statusFilter === f.key ? '#fff' : 'var(--text-secondary)',
              }}>{f.label}{f.key === '' ? ` (${tasks.length})` : ` (${tasks.filter(t => t.status === f.key).length})`}</button>
          ))}
        </div>

        {(() => {
          const filtered = statusFilter ? tasks.filter(t => t.status === statusFilter) : tasks
          return filtered.length === 0 ? <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>暂无任务</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((t: any) => {
              const ts = taskStatusMap[t.status] || taskStatusMap.todo
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{t.description}</div>}
                    {t.created_at && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>创建: {formatDateTime(t.created_at)}</div>}
                    {t.due_date && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>截止: {t.due_date}</div>}
                    {t.attachments && t.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {t.attachments.map((a: any) => {
                          const isImage = a.mime_type?.startsWith('image/')
                          const fileUrl = `/uploads/${a.filename}`
                          if (isImage) {
                            return (
                              <div key={a.id} onClick={() => setPreviewImg(fileUrl)} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-primary)', width: 80, height: 80, flexShrink: 0 }}>
                                <img src={fileUrl} alt={a.original_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )
                          }
                          return (
                            <a key={a.id} href={fileUrl} target="_blank" rel="noreferrer"
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
        )
        })()}
      </div>

      {/* 微信风格的任务输入框 */}
      {canEdit && (
        <div style={{ ...section, padding: 0, overflow: 'hidden' }}>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => {
            if (e.target.files) addTaskFiles(e.target.files)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }} />

          {/* 已选附件预览 */}
          {taskFiles.length > 0 && (
            <div style={{ padding: '8px 14px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {taskFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--bg-selected)', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: 12, color: 'var(--brand)' }}>
                  {f.type.startsWith('image/') ? <Image size={12} color="var(--brand)" /> : <FileText size={12} />}
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => setTaskFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}

          {/* 展开更多选项 */}
          {showExtra && (
            <div style={{ padding: '10px 14px 0', display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>描述:</span>
                <input value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="任务详情..." style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', width: 160, background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>截止:</span>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>优先:</span>
                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }}>
                  <option value="low">低</option><option value="medium">中</option><option value="high">高</option>
                </select>
              </div>
            </div>
          )}

          {/* 主输入行 - 类似微信底部 */}
          <div
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
            style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px',
              background: isDragging ? 'var(--bg-selected)' : 'var(--bg-primary)',
              borderTop: (taskFiles.length > 0 || showExtra) ? '1px solid var(--border-primary)' : 'none',
            }}>
            {/* 附件按钮 */}
            <button onClick={() => fileInputRef.current?.click()} title="添加附件"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: 'none', background: 'var(--bg-tertiary)', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
              <Plus size={18} />
            </button>
            {/* 更多选项按钮 */}
            <button onClick={() => setShowExtra(!showExtra)} title="更多选项"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: 'none', background: showExtra ? 'var(--bg-selected)' : 'var(--bg-tertiary)', cursor: 'pointer', color: showExtra ? 'var(--brand)' : 'var(--text-secondary)', flexShrink: 0 }}>
              {showExtra ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
            {/* 输入框 */}
            <textarea
              ref={chatInputRef}
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitTask() } }}
              onPaste={handleFilePaste}
              placeholder="输入任务标题，回车发送..."
              rows={1}
              style={{ flex: 1, padding: '7px 12px', borderRadius: 18, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 80, overflow: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-body)' }}
            />
            {/* 发送按钮 */}
            <button onClick={handleSubmitTask} disabled={submitting || !taskForm.title.trim()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', border: 'none',
                background: taskForm.title.trim() ? 'var(--brand)' : 'var(--bg-tertiary)',
                color: taskForm.title.trim() ? '#fff' : 'var(--text-disabled)',
                cursor: taskForm.title.trim() ? 'pointer' : 'default', flexShrink: 0, transition: 'all 0.15s' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

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
