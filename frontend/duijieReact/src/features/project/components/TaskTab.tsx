import { useState, useEffect, useRef, useCallback, DragEvent, ClipboardEvent } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, FileText, Image, Paperclip, Download, AlertTriangle, Check, X } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Badge from '../../ui/Badge'
import Input from '../../ui/Input'
import TaskTitleSelector from '../../task/components/TaskTitleSelector'
import { projectApi } from '../services/api'
import { taskApi } from '../../task/services/api'
import { toast } from '../../ui/Toast'
import { formatDateTime } from '../../../utils/datetime'
import useUserStore from '../../../stores/useUserStore'
import ImageViewer from '../../ui/ImageViewer'
import ImageEditor from '../../ui/ImageEditor'

const taskStatusMap: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: 'gray' },
  submitted: { label: '已提出', color: 'blue' },
  disputed: { label: '待补充', color: 'yellow' },
  in_progress: { label: '执行中', color: 'purple' },
  pending_review: { label: '待验收', color: 'orange' },
  review_failed: { label: '验收不通过', color: 'red' },
  accepted: { label: '验收通过', color: 'green' },
}

const ALL_STATUSES = ['submitted', 'disputed', 'in_progress', 'pending_review', 'review_failed', 'accepted'] as const

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface TaskTabProps {
  tasks: any[]
  canEdit: boolean
  projectId: string
  loadTasks: () => void
}

export default function TaskTab({ tasks, canEdit, projectId, loadTasks }: TaskTabProps) {
  const user = useUserStore(s => s.user)
  const currentUserId = user?.id
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showDeleteTask, setShowDeleteTask] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' })
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const [deleteSelected, setDeleteSelected] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewStartIdx, setPreviewStartIdx] = useState(0)
  const [editingSrc, setEditingSrc] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const [trashTasks, setTrashTasks] = useState<any[]>([])
  const [trashLoading, setTrashLoading] = useState(false)
  const [expandedTask, setExpandedTask] = useState<number | null>(null)
  const [showPointsModal, setShowPointsModal] = useState<{ taskId: number; roundType: 'initial' | 'acceptance'; taskTitle: string } | null>(null)
  const [pointInputs, setPointInputs] = useState<string[]>([''])
  const [responseInputs, setResponseInputs] = useState<Record<number, string>>({})
  const [editingImage, setEditingImage] = useState<File | null>(null)
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [editingExistingIdx, setEditingExistingIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const resetCreateForm = useCallback(() => {
    setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' })
    setTaskFiles([])
  }, [])

  const addTaskFiles = useCallback((newFiles: FileList | File[]) => {
    const MAX_FILES = 20
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024
    const arr = Array.from(newFiles)
    setTaskFiles(prev => {
      const currentTotal = prev.reduce((s, f) => s + f.size, 0)
      const remaining = MAX_FILES - prev.length
      if (remaining <= 0) { toast(`最多上传 ${MAX_FILES} 个文件`, 'error'); return prev }
      const allowed = arr.slice(0, remaining)
      let sizeSum = currentTotal
      const filtered = allowed.filter(f => {
        if (sizeSum + f.size > MAX_TOTAL_SIZE) return false
        sizeSum += f.size
        return true
      })
      if (filtered.length < arr.length) toast(`文件数量上限 ${MAX_FILES}，总大小上限 100MB`, 'error')
      const nonImages = filtered.filter(f => !f.type.startsWith('image/'))
      const images = filtered.filter(f => f.type.startsWith('image/'))
      if (images.length) {
        setEditingImage(images[0])
        setPendingImages(images.slice(1))
      }
      return [...prev, ...nonImages]
    })
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
    if (pastedFiles.length) { e.preventDefault(); e.stopPropagation(); addTaskFiles(pastedFiles) }
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

  const handleEditorConfirm = useCallback((editedFile: File) => {
    if (editingExistingIdx !== null) {
      setTaskFiles(prev => prev.map((f, i) => i === editingExistingIdx ? editedFile : f))
      setEditingExistingIdx(null)
    } else {
      setTaskFiles(prev => [...prev, editedFile])
    }
    setEditingImage(null)
    if (pendingImages.length > 0) {
      setTimeout(() => { setEditingImage(pendingImages[0]); setPendingImages(prev => prev.slice(1)) }, 100)
    }
  }, [editingExistingIdx, pendingImages])

  const handleEditorCancel = useCallback(() => {
    if (editingExistingIdx !== null) setEditingExistingIdx(null)
    setEditingImage(null)
    if (pendingImages.length > 0) {
      setTimeout(() => { setEditingImage(pendingImages[0]); setPendingImages(prev => prev.slice(1)) }, 100)
    }
  }, [editingExistingIdx, pendingImages])

  const handleMove = async (taskId: number, newStatus: string) => {
    const r = await taskApi.move(String(taskId), newStatus)
    if (r.success) loadTasks()
    else toast(r.message || '状态切换失败', 'error')
  }

  const handleSubmitPoints = async () => {
    if (!showPointsModal) return
    const validPoints = pointInputs.filter(p => p.trim())
    if (validPoints.length === 0) { toast('请至少填写一个要点', 'error'); return }
    setSubmitting(true)
    const r = await taskApi.addReviewPoints(String(showPointsModal.taskId), validPoints, showPointsModal.roundType)
    if (r.success) {
      toast(showPointsModal.roundType === 'initial' ? '已提出疑问' : '已驳回并列出问题', 'success')
      setShowPointsModal(null)
      setPointInputs([''])
      loadTasks()
    } else toast(r.message || '操作失败', 'error')
    setSubmitting(false)
  }

  const handleRespond = async (pointId: number) => {
    const resp = responseInputs[pointId]?.trim()
    if (!resp) { toast('请输入回复内容', 'error'); return }
    const r = await taskApi.respondReviewPoint(pointId, resp)
    if (r.success) {
      setResponseInputs(prev => { const n = { ...prev }; delete n[pointId]; return n })
      loadTasks()
    } else toast(r.message || '回复失败', 'error')
  }

  const handleConfirm = async (pointId: number) => {
    const r = await taskApi.confirmReviewPoint(pointId)
    if (r.success) loadTasks()
    else toast(r.message || '确认失败', 'error')
  }

  const loadTrash = async () => {
    setTrashLoading(true)
    const r = await taskApi.trash(projectId)
    if (r.success) setTrashTasks(r.data || [])
    setTrashLoading(false)
  }

  const handleRestore = async (taskId: number) => {
    const r = await taskApi.restore(String(taskId))
    if (r.success) {
      toast('已恢复需求', 'success')
      setTrashTasks(prev => prev.filter(t => t.id !== taskId))
      loadTasks()
    } else toast(r.message || '恢复失败', 'error')
  }

  const [actionMenuTask, setActionMenuTask] = useState<number | null>(null)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!actionMenuTask) return
    const h = (e: MouseEvent) => { if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setActionMenuTask(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [actionMenuTask])

  // 获取当前状态可执行的操作列表
  const getWorkflowOptions = (t: any): { label: string; action: () => void; color: string; bg: string }[] => {
    const isAssignee = t.assignee_id === currentUserId
    const isCreator = t.created_by === currentUserId
    const noAssignee = !t.assignee_id
    const status = t.status
    const options: { label: string; action: () => void; color: string; bg: string }[] = []

    if (status === 'submitted' || status === 'todo') {
      if (isAssignee || noAssignee || isCreator) {
        options.push({ label: '▶ 接受执行', action: () => handleMove(t.id, 'in_progress'), color: '#fff', bg: 'var(--brand)' })
        options.push({ label: '💬 提出疑问', action: () => { setShowPointsModal({ taskId: t.id, roundType: 'initial', taskTitle: t.title }); setPointInputs(['']); setActionMenuTask(null) }, color: '#92400e', bg: '#fef3c7' })
      }
    }
    if (status === 'in_progress') {
      if (isAssignee || noAssignee || isCreator) {
        options.push({ label: '📤 提交验收', action: () => handleMove(t.id, 'pending_review'), color: '#1e40af', bg: '#dbeafe' })
      }
    }
    if (status === 'pending_review') {
      if (isCreator || noAssignee || (!isAssignee && canEdit)) {
        options.push({ label: '✅ 验收通过', action: () => handleMove(t.id, 'accepted'), color: '#065f46', bg: '#d1fae5' })
        options.push({ label: '❌ 驳回', action: () => { setShowPointsModal({ taskId: t.id, roundType: 'acceptance', taskTitle: t.title }); setPointInputs(['']); setActionMenuTask(null) }, color: '#991b1b', bg: '#fee2e2' })
      }
    }
    if (status === 'review_failed') {
      if (isAssignee || noAssignee || isCreator) {
        options.push({ label: '🔄 已修复', action: () => handleMove(t.id, 'pending_review'), color: '#1e40af', bg: '#dbeafe' })
      }
    }
    return options
  }

  const renderReviewPoints = (t: any) => {
    const points = t.review_points || []
    if (points.length === 0) return null
    const isAssignee = t.assignee_id === currentUserId
    const isCreator = t.created_by === currentUserId

    const initialPts = points.filter((p: any) => p.round_type === 'initial')
    const acceptancePts = points.filter((p: any) => p.round_type === 'acceptance')

    const renderPointGroup = (pts: any[], title: string) => {
      if (pts.length === 0) return null
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} /> {title} ({pts.filter((p: any) => p.status === 'confirmed').length}/{pts.length} 已确认)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pts.map((p: any) => {
              const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                pending: { bg: '#fef3c7', text: '#92400e', label: '待回答' },
                answered: { bg: '#dbeafe', text: '#1e40af', label: '已回答' },
                confirmed: { bg: '#d1fae5', text: '#065f46', label: '已确认' },
              }
              const sc = statusColors[p.status] || statusColors.pending
              const canRespondPt = p.status === 'pending' && (
                (p.round_type === 'initial' && isCreator) ||
                (p.round_type === 'acceptance' && isAssignee)
              )
              const canConfirmPt = p.status === 'answered' && (
                (p.round_type === 'initial' && isAssignee) ||
                (p.round_type === 'acceptance' && (isCreator || (!isAssignee && canEdit)))
              )

              return (
                <div key={p.id} style={{ padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: 500 }}>{p.content}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{p.author_name} · {formatDateTime(p.created_at)}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: sc.bg, color: sc.text, fontWeight: 500, flexShrink: 0 }}>{sc.label}</span>
                  </div>
                  {p.response && (
                    <div style={{ marginTop: 6, padding: '6px 8px', background: 'var(--bg-tertiary)', borderRadius: 6, borderLeft: '3px solid var(--brand)' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{p.response}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{p.responder_name} · {formatDateTime(p.response_at)}</div>
                    </div>
                  )}
                  {canRespondPt && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      <input value={responseInputs[p.id] || ''} onChange={e => setResponseInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="输入回复..."
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRespond(p.id) } }}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }}
                      />
                      <button onClick={() => handleRespond(p.id)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                        回复
                      </button>
                    </div>
                  )}
                  {canConfirmPt && (
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleConfirm(p.id)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#d1fae5', color: '#065f46', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                        <Check size={11} style={{ marginRight: 3, verticalAlign: -1 }} />确认OK
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <>
        {renderPointGroup(initialPts, '初审疑问')}
        {renderPointGroup(acceptancePts, '验收问题')}
      </>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ ...section, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>需求列表</h3>
          {canEdit && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowCreateTask(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: 'var(--brand)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}><Plus size={14} /> 添加</button>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
                display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 8,
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', cursor: 'pointer',
              }}><ChevronDown size={16} /></button>
              {dropdownOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', minWidth: 120, zIndex: 10, overflow: 'hidden' }}>
                  <button onClick={() => { setDropdownOpen(false); setDeleteSelected(new Set()); setShowDeleteTask(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-danger)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Trash2 size={14} /> 删除
                  </button>
                  <button onClick={() => { setDropdownOpen(false); setShowTrash(true); loadTrash() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    🗑️ 回收站
                  </button>
                </div>
              )}
            </div>
          </div>}
        </div>

        {/* 状态筛选 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[{ key: '', label: '全部' }, ...ALL_STATUSES.map(s => ({ key: s, label: taskStatusMap[s].label }))].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: statusFilter === f.key ? 'var(--brand)' : 'var(--bg-tertiary)',
                color: statusFilter === f.key ? '#fff' : 'var(--text-secondary)',
              }}>{f.label}{f.key === '' ? ` (${tasks.length})` : ` (${tasks.filter(t => t.status === f.key).length})`}</button>
          ))}
        </div>

        {/* 工作流说明 */}
        <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 10, lineHeight: 1.5, flexShrink: 0 }}>
          流程: 已提出 → 负责人接受/提疑问 → 执行中 → 待验收 → 通过/驳回
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {(() => {
          const filtered = statusFilter ? tasks.filter(t => t.status === statusFilter) : tasks
          return filtered.length === 0 ? <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>暂无需求</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((t: any) => {
              const ts = taskStatusMap[t.status] || taskStatusMap.submitted
              const isExpanded = expandedTask === t.id
              const hasPoints = t.review_points && t.review_points.length > 0
              return (
                <div key={t.id} style={{ background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'visible' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
                    {hasPoints && (
                      <button onClick={() => setExpandedTask(isExpanded ? null : t.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{t.title}</span>
                        {hasPoints && !isExpanded && (
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer' }}
                            onClick={() => setExpandedTask(t.id)}>
                            ({t.review_points.length} 条审核要点)
                          </span>
                        )}
                      </div>
                      {t.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{t.description}</div>}
                      <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                        {t.created_at && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>创建: {formatDateTime(t.created_at)}</span>}
                        {t.due_date && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>截止: {t.due_date}</span>}
                        {(t.assignee_name || t.assigned_name) && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>负责人: {t.assignee_name || t.assigned_name}</span>}
                        {t.creator_name && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>创建者: {t.creator_name}</span>}
                      </div>
                      {t.attachments && t.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {t.attachments.map((a: any) => {
                            const isImage = a.mime_type?.startsWith('image/')
                            const fileUrl = `/uploads/${a.filename}`
                            if (isImage) {
                              const allImgs = t.attachments.filter((x: any) => x.mime_type?.startsWith('image/')).map((x: any) => `/uploads/${x.filename}`)
                              const imgIdx = allImgs.indexOf(fileUrl)
                              return (
                                <div key={a.id} onClick={() => { setPreviewImg(fileUrl); setPreviewImages(allImgs); setPreviewStartIdx(Math.max(0, imgIdx)) }} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-primary)', width: 80, height: 80, flexShrink: 0 }}>
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
                    {/* 复合状态按钮 */}
                    {(() => {
                      const options = canEdit ? getWorkflowOptions(t) : []
                      const hasOptions = options.length > 0
                      const isMenuOpen = actionMenuTask === t.id
                      return (
                        <div ref={isMenuOpen ? actionMenuRef : undefined} style={{ position: 'relative', flexShrink: 0 }}>
                          <button onClick={() => hasOptions ? setActionMenuTask(isMenuOpen ? null : t.id) : undefined}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6,
                              border: '1px solid var(--border-primary)', fontSize: 12, fontWeight: 600,
                              background: ts.color === 'green' ? '#d1fae5' : ts.color === 'red' ? '#fee2e2' : ts.color === 'yellow' ? '#fef3c7' : ts.color === 'purple' ? '#f3e8ff' : ts.color === 'orange' ? '#ffedd5' : ts.color === 'blue' ? '#dbeafe' : 'var(--bg-tertiary)',
                              color: ts.color === 'green' ? '#065f46' : ts.color === 'red' ? '#991b1b' : ts.color === 'yellow' ? '#92400e' : ts.color === 'purple' ? '#6b21a8' : ts.color === 'orange' ? '#9a3412' : ts.color === 'blue' ? '#1e40af' : 'var(--text-secondary)',
                              cursor: hasOptions ? 'pointer' : 'default', whiteSpace: 'nowrap',
                            }}>
                            {ts.label}
                            {hasOptions && <ChevronDown size={12} />}
                          </button>
                          {isMenuOpen && hasOptions && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: '1px solid var(--border-primary)', minWidth: 140, zIndex: 20, overflow: 'hidden' }}>
                              {options.map((opt, i) => (
                                <button key={i} onClick={() => { setActionMenuTask(null); opt.action() }}
                                  style={{ display: 'block', width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-body)', textAlign: 'left', whiteSpace: 'nowrap' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = opt.bg; e.currentTarget.style.color = opt.color }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-body)' }}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  {isExpanded && hasPoints && (
                    <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-primary)' }}>
                      {renderReviewPoints(t)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
        })()}
        </div>
      </div>

      {/* 审核要点模态框 */}
      <Modal open={!!showPointsModal} onClose={() => { setShowPointsModal(null); setPointInputs(['']) }}
        title={showPointsModal?.roundType === 'initial' ? `提出疑问 - ${showPointsModal?.taskTitle}` : `驳回并列出问题 - ${showPointsModal?.taskTitle}`} width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {showPointsModal?.roundType === 'initial' ? '请列出需要需求创建者补充说明的要点：' : '请列出验收不通过的具体问题：'}
          </div>
          {pointInputs.map((val, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500, width: 24 }}>{i + 1}.</span>
              <input value={val} onChange={e => {
                const arr = [...pointInputs]; arr[i] = e.target.value; setPointInputs(arr)
              }} placeholder={`要点 ${i + 1}`}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-body)' }}
              />
              {pointInputs.length > 1 && (
                <button onClick={() => setPointInputs(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setPointInputs(prev => [...prev, ''])}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px dashed var(--border-primary)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--brand)', alignSelf: 'flex-start' }}>
            + 添加要点
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => { setShowPointsModal(null); setPointInputs(['']) }}>取消</Button>
            <Button disabled={submitting} onClick={handleSubmitPoints}>
              {submitting ? '提交中...' : showPointsModal?.roundType === 'initial' ? '提出疑问' : '驳回'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 创建需求模态框 */}
      <Modal open={showCreateTask} onClose={() => { setShowCreateTask(false); resetCreateForm() }} title="添加需求" width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TaskTitleSelector open={showCreateTask} projectId={projectId} value={taskForm.title} onChange={title => setTaskForm({ ...taskForm, title })} required />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Input label="截止日期" type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>优先级</label>
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
                <option value="low">低</option><option value="medium">中</option><option value="high">高</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>内容 / 附件</label>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => {
              if (e.target.files) addTaskFiles(e.target.files)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }} />
            <div onDragOver={handleFileDragOver} onDragLeave={handleFileDragLeave} onDrop={handleFileDrop}
              style={{ borderRadius: 12, border: `1px solid ${isDragging ? 'var(--brand)' : '#cbd5e1'}`, background: isDragging ? 'var(--bg-selected)' : 'var(--bg-secondary)', transition: 'all 0.15s', overflow: 'hidden' }}>
              <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} onPaste={handleFilePaste}
                placeholder="输入需求描述，可直接粘贴图片或拖入文件..." rows={3}
                style={{ width: '100%', padding: '10px 12px', border: 'none', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit', background: 'transparent', color: 'var(--text-body)' }} />
              {taskFiles.length > 0 && (
                <div style={{ padding: '6px 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid var(--border-primary)' }}>
                  {taskFiles.map((f, i) => {
                    const isImg = f.type.startsWith('image/')
                    return (
                      <div key={i} style={{ position: 'relative', display: 'inline-flex' }}>
                        {isImg ? (
                          <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-primary)', position: 'relative' }}>
                            <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={(e) => { e.stopPropagation(); setEditingExistingIdx(i); setEditingImage(f) }}
                              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, padding: '2px 0', textAlign: 'center' }}>编辑</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 12, color: 'var(--text-body)' }}>
                            <FileText size={12} />
                            <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                          </div>
                        )}
                        <button onClick={() => setTaskFiles(prev => prev.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}>×</button>
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
                <button onClick={() => fileInputRef.current?.click()} title="添加文件/图片"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Paperclip size={14} /> 文件
                </button>
                <button onClick={() => { const inp = fileInputRef.current; if (inp) { inp.accept = 'image/*'; inp.click(); setTimeout(() => inp.accept = '', 100) } }} title="添加图片"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Image size={14} /> 图片
                </button>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>支持拖拽 / Ctrl+V 粘贴</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setShowCreateTask(false); resetCreateForm() }}>取消</Button>
            <Button disabled={submitting} onClick={async () => {
              const title = taskForm.title.trim()
              if (!title) { toast('请输入需求标题', 'error'); return }
              setSubmitting(true)
              const r = await taskApi.create({ project_id: Number(projectId), title, description: taskForm.description, due_date: taskForm.due_date || undefined, priority: taskForm.priority, status: 'submitted' }, taskFiles.length > 0 ? taskFiles : undefined)
              if (r.success) {
                const rememberResult = await projectApi.rememberTaskTitle(projectId, title)
                if (!rememberResult.success) toast(rememberResult.message || '需求标题历史保存失败', 'error')
                toast('需求创建成功', 'success')
                window.dispatchEvent(new CustomEvent('onboarding-done', { detail: { type: 'create_task' } }))
                setShowCreateTask(false)
                resetCreateForm()
                loadTasks()
              } else toast(r.message || '创建失败', 'error')
              setSubmitting(false)
            }}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>

      {/* 删除需求模态框 */}
      <Modal open={showDeleteTask} onClose={() => setShowDeleteTask(false)} title="删除需求" width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.length === 0 ? <div style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 20 }}>暂无需求</div> : (<>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>选择要删除的需求（删除后可在回收站恢复）：</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
              {tasks.map((t: any) => {
                const isAccepted = t.status === 'accepted'
                return (
                <label key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: isAccepted ? 'var(--bg-tertiary)' : deleteSelected.has(t.id) ? '#fef2f2' : 'var(--bg-secondary)', borderRadius: 8, cursor: isAccepted ? 'not-allowed' : 'pointer', border: deleteSelected.has(t.id) ? '1px solid #fca5a5' : '1px solid transparent', opacity: isAccepted ? 0.55 : 1 }}>
                  <input type="checkbox" style={{ marginTop: 3 }} checked={deleteSelected.has(t.id)} disabled={isAccepted} onChange={() => {
                    if (isAccepted) return
                    setDeleteSelected(prev => {
                      const n = new Set(prev)
                      if (n.has(t.id)) n.delete(t.id)
                      else n.add(t.id)
                      return n
                    })
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{t.title}</div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>ID {t.id}</span>
                    </div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                      {t.created_at && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>创建: {formatDateTime(t.created_at)}</span>}
                      {t.due_date && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>截止: {t.due_date}</span>}
                      {(t.assignee_name || t.assigned_name) && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>负责人: {t.assignee_name || t.assigned_name}</span>}
                      {t.creator_name && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>创建者: {t.creator_name}</span>}
                    </div>
                  </div>
                  <Badge color={(taskStatusMap[t.status] || taskStatusMap.submitted).color}>{(taskStatusMap[t.status] || taskStatusMap.submitted).label}</Badge>
                </label>
              )})}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>已选 {deleteSelected.size} 项</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={() => setShowDeleteTask(false)}>取消</Button>
                <Button variant="danger" disabled={deleteSelected.size === 0 || submitting} onClick={async () => {
                  setSubmitting(true)
                  for (const tid of deleteSelected) await taskApi.remove(String(tid))
                  toast(`已删除 ${deleteSelected.size} 个需求`, 'success')
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

      {/* 回收站模态框 */}
      <Modal open={showTrash} onClose={() => setShowTrash(false)} title="回收站" width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>项目成员（管理员/成员）可以恢复已删除的需求</div>
          {trashLoading ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>加载中...</div> :
           trashTasks.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 14 }}>回收站为空</div> :
           <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
             {trashTasks.map((t: any) => (
               <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                 <div style={{ flex: 1, minWidth: 0 }}>
                   <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                   <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                     {t.creator_name && `创建者: ${t.creator_name}`}
                     {t.updated_at && ` · 删除于: ${formatDateTime(t.updated_at)}`}
                   </div>
                 </div>
                 <Badge color={(taskStatusMap[t.status] || taskStatusMap.submitted).color}>
                   {(taskStatusMap[t.status] || taskStatusMap.submitted).label}
                 </Badge>
                 {canEdit && (
                   <button onClick={() => handleRestore(t.id)}
                     style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--brand)', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--brand)', whiteSpace: 'nowrap' }}
                     onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = '#fff' }}
                     onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--brand)' }}>
                     恢复
                   </button>
                 )}
               </div>
             ))}
           </div>
          }
        </div>
      </Modal>

      {previewImg && <ImageViewer src={previewImg} onClose={() => { setPreviewImg(null); setPreviewImages([]) }}
        images={previewImages.length > 1 ? previewImages : undefined} startIndex={previewStartIdx}
        onEdit={(s) => { setPreviewImg(null); setEditingSrc(s) }} />}
      {editingSrc && <ImageEditor imageSrc={editingSrc} onConfirm={() => { setEditingSrc(null) }} onCancel={() => setEditingSrc(null)} />}
      {editingImage && <ImageEditor imageFile={editingImage} onConfirm={handleEditorConfirm} onCancel={handleEditorCancel} />}
    </div>
  )
}
