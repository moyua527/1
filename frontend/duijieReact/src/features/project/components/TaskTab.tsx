import { useState, useEffect, useRef } from 'react'
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

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>任务列表</h3>
          {canEdit && <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}>操作 <ChevronDown size={14} /></button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', minWidth: 120, zIndex: 10, overflow: 'hidden' }}>
                <button onClick={() => { setDropdownOpen(false); setShowCreateTask(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#334155' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Plus size={14} color="#2563eb" /> 添加任务
                </button>
                <button onClick={() => { setDropdownOpen(false); setDeleteSelected(new Set()); setShowDeleteTask(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc2626' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Trash2 size={14} /> 删除任务
                </button>
              </div>
            )}
          </div>}
        </div>
        {tasks.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无任务</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map((t: any) => {
              const ts = taskStatusMap[t.status] || taskStatusMap.todo
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{t.description}</div>}
                    {t.due_date && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>截止: {t.due_date}</div>}
                    {t.attachments && t.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {t.attachments.map((a: any) => (
                          <a key={a.id} href={`/api/tasks/attachments/${a.id}/download`} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#eff6ff', borderRadius: 6, fontSize: 12, color: '#2563eb', textDecoration: 'none', border: '1px solid #dbeafe' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }} onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff' }}>
                            {a.mime_type?.startsWith('image/') ? <Image size={12} /> : <Paperclip size={12} />}
                            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.original_name}</span>
                            <Download size={10} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <select value={t.status} disabled={!canEdit} onChange={async (e) => {
                    await taskApi.move(String(t.id), e.target.value)
                    loadTasks()
                  }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.6 }}>
                    <option value="todo">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="pending_review">待验收</option>
                    <option value="accepted">验收通过</option>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>任务描述</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="描述任务内容..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }} />
          </div>
          <Input label="截止日期" type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>优先级</label>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>附件（文件/图片）</label>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => {
              if (e.target.files) setTaskFiles(prev => [...prev, ...Array.from(e.target.files!)])
              if (fileInputRef.current) fileInputRef.current.value = ''
            }} />
            <button onClick={() => fileInputRef.current?.click()} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              border: '1px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#64748b', width: '100%', justifyContent: 'center',
            }}><Upload size={14} /> 点击选择文件、图片</button>
            {taskFiles.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {taskFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: '#f1f5f9', borderRadius: 6, fontSize: 13 }}>
                    {f.type.startsWith('image/') ? <Image size={14} color="#2563eb" /> : <FileText size={14} color="#64748b" />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }}>{f.name}</span>
                    <button onClick={() => setTaskFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}><X size={14} /></button>
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
          {tasks.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 20 }}>暂无任务可删除</div> : (<>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>选择要删除的任务：</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
              {tasks.map((t: any) => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: deleteSelected.has(t.id) ? '#fef2f2' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: deleteSelected.has(t.id) ? '1px solid #fca5a5' : '1px solid transparent' }}>
                  <input type="checkbox" checked={deleteSelected.has(t.id)} onChange={() => {
                    setDeleteSelected(prev => { const n = new Set(prev); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n })
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{t.title}</div>
                    {t.due_date && <div style={{ fontSize: 12, color: '#94a3b8' }}>截止: {t.due_date}</div>}
                  </div>
                  <Badge color={(taskStatusMap[t.status] || taskStatusMap.todo).color}>{(taskStatusMap[t.status] || taskStatusMap.todo).label}</Badge>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>已选 {deleteSelected.size} 项</span>
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
    </>
  )
}
