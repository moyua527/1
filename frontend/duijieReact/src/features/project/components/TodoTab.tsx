import { useState, useCallback, useEffect, useRef } from 'react'
import { Plus, Check, ChevronDown, Trash2, RotateCcw } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import { toast } from '../../ui/Toast'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import { confirm } from '../../ui/ConfirmDialog'
import TodoDetailModal from './TodoDetailModal'

interface TodoItem {
  id: number
  title: string
  description?: string
  is_completed: boolean
  progress: number
  sort_order: number
  created_at: string
  updated_at?: string
}

interface Props {
  projectId: string
  canEdit: boolean
  isMobile?: boolean
  currentUserId?: number
  members?: any[]
}

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '进行中' },
  { key: 'completed', label: '已完成' },
] as const

export default function TodoTab({ projectId, canEdit, isMobile, currentUserId, members = [] }: Props) {
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [deleteSelected, setDeleteSelected] = useState<Set<number>>(new Set())
  const [showTrash, setShowTrash] = useState(false)
  const [trashItems, setTrashItems] = useState<TodoItem[]>([])
  const [trashLoading, setTrashLoading] = useState(false)

  const load = useCallback(() => {
    fetchApi(`/api/milestones?project_id=${projectId}`).then(r => {
      if (r.success) setItems((r.data || []).sort((a: TodoItem, b: TodoItem) => a.sort_order - b.sort_order))
      setLoading(false)
    })
  }, [projectId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!dropdownOpen && !filterOpen) return
    const h = (e: MouseEvent) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [dropdownOpen, filterOpen])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    const r = await fetchApi('/api/milestones', {
      method: 'POST',
      body: JSON.stringify({ project_id: Number(projectId), title: newTitle.trim(), description: newDesc.trim() || undefined }),
    })
    setSaving(false)
    if (r.success) {
      setNewTitle('')
      setNewDesc('')
      setShowCreate(false)
      load()
    } else toast(r.message || '添加失败', 'error')
  }

  const handleDeleteSelected = async () => {
    if (deleteSelected.size === 0) return
    if (!(await confirm({ message: `确定删除选中的 ${deleteSelected.size} 个代办？删除后可在回收站恢复。` }))) return
    let ok = 0
    for (const id of deleteSelected) {
      const r = await fetchApi(`/api/milestones/${id}`, { method: 'DELETE' })
      if (r.success) ok++
    }
    toast(`已删除 ${ok} 个代办`, 'success')
    setDeleteSelected(new Set())
    setDeleteMode(false)
    load()
  }

  const loadTrash = async () => {
    setTrashLoading(true)
    const r = await fetchApi(`/api/milestones/trash?project_id=${projectId}`)
    if (r.success) setTrashItems(r.data || [])
    setTrashLoading(false)
  }

  const handleRestore = async (id: number) => {
    const r = await fetchApi(`/api/milestones/${id}/restore`, { method: 'PATCH' })
    if (r.success) {
      toast('已恢复', 'success')
      loadTrash()
      load()
    } else toast(r.message || '恢复失败', 'error')
  }

  const filtered = items.filter(i => {
    if (filter === 'pending') return !i.is_completed
    if (filter === 'completed') return i.is_completed
    return true
  })

  const completedCount = items.filter(i => i.is_completed).length
  const pendingCount = items.length - completedCount

  const formatDt = (d: string) => {
    try {
      return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch { return d }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: isMobile ? 0 : 12, padding: isMobile ? 12 : 20, boxShadow: isMobile ? 'none' : '0 1px 3px rgba(0,0,0,0.06)', marginBottom: isMobile ? 0 : 16, flex: isMobile ? 1 : undefined, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 0 : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'space-between', marginBottom: isMobile ? 8 : 12, flexWrap: isMobile ? 'nowrap' : 'wrap', gap: 8 }}>
        {!isMobile && <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>代办</h2>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', flex: isMobile ? 1 : undefined }}>
          {isMobile ? (
            <div ref={filterRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <button onClick={() => setFilterOpen(!filterOpen)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 12,
                background: 'var(--bg-primary)', color: 'var(--text-heading)', cursor: 'pointer',
              }}>
                <span>{statusFilters.find(s => s.key === filter)?.label || '全部'} ({filter === 'all' ? items.length : filter === 'pending' ? pendingCount : completedCount})</span>
                <ChevronDown size={14} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
              </button>
              {filterOpen && (() => {
                const rect = filterRef.current?.getBoundingClientRect()
                const spaceBelow = rect ? window.innerHeight - rect.bottom : 200
                const openUp = spaceBelow < 140
                return (
                  <div style={{
                    position: 'absolute', left: 0, [openUp ? 'bottom' : 'top']: openUp ? '100%' : '100%',
                    marginTop: openUp ? 0 : 4, marginBottom: openUp ? 4 : 0,
                    background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    border: '1px solid var(--border-primary)', minWidth: '100%', zIndex: 1000, overflow: 'hidden',
                  }}>
                    {statusFilters.map(sf => {
                      const count = sf.key === 'all' ? items.length : sf.key === 'pending' ? pendingCount : completedCount
                      return (
                        <button key={sf.key} onClick={() => { setFilter(sf.key); setFilterOpen(false) }} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                          padding: '10px 12px', border: 'none', background: filter === sf.key ? 'rgba(59,130,246,0.08)' : 'none',
                          cursor: 'pointer', fontSize: 13, color: filter === sf.key ? 'var(--brand)' : 'var(--text-body)', fontWeight: filter === sf.key ? 600 : 400,
                        }}>
                          <span>{sf.label} ({count})</span>
                          {filter === sf.key && <Check size={14} />}
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {statusFilters.map(sf => {
                const count = sf.key === 'all' ? items.length : sf.key === 'pending' ? pendingCount : completedCount
                const active = filter === sf.key
                return (
                  <button key={sf.key} onClick={() => setFilter(sf.key)} style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: active ? 'var(--brand)' : 'var(--bg-tertiary)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                  }}>
                    {sf.label} ({count})
                  </button>
                )
              })}
            </div>
          )}
          {canEdit && <>
            <button onClick={() => setShowCreate(true)} style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 4, padding: isMobile ? '6px 10px' : '6px 14px', borderRadius: 8, border: 'none',
              background: 'var(--brand)', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
            }}>
              <Plus size={isMobile ? 12 : 14} /> 新增
            </button>
            <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => {
                setDropdownOpen(!dropdownOpen)
                if (!dropdownOpen && dropdownRef.current) {
                  const r = dropdownRef.current.getBoundingClientRect()
                  setDropdownPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
                }
              }} style={{
                display: 'flex', alignItems: 'center', padding: isMobile ? '6px 8px' : '8px 10px', borderRadius: 8,
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', cursor: 'pointer',
              }}><ChevronDown size={16} /></button>
              {dropdownOpen && (
                <div style={{ position: 'fixed', top: dropdownPos.top, right: Math.max(Math.min(dropdownPos.right, window.innerWidth - 136), 8), background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', minWidth: 120, zIndex: 1000, overflow: 'hidden' }}>
                  <button onClick={() => { setDropdownOpen(false); setDeleteSelected(new Set()); setDeleteMode(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-danger)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Trash2 size={14} /> 删除
                  </button>
                  <button onClick={() => { setDropdownOpen(false); setShowTrash(true); loadTrash() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Trash2 size={14} /> 回收站
                  </button>
                </div>
              )}
            </div>
          </>}
        </div>
      </div>

      {deleteMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 500 }}>已选 {deleteSelected.size} 项</span>
          <div style={{ flex: 1 }} />
          <Button variant="secondary" onClick={() => { setDeleteMode(false); setDeleteSelected(new Set()) }} style={{ fontSize: 12, padding: '4px 10px' }}>取消</Button>
          <Button onClick={handleDeleteSelected} disabled={deleteSelected.size === 0} style={{ fontSize: 12, padding: '4px 10px', background: 'var(--color-danger)' }}>删除</Button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>
            {items.length === 0 ? '暂无代办步骤' : '当前筛选无结果'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  if (deleteMode) {
                    setDeleteSelected(prev => {
                      const next = new Set(prev)
                      next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                      return next
                    })
                  } else {
                    setDetailId(item.id)
                  }
                }}
                style={{
                  background: deleteMode && deleteSelected.has(item.id) ? 'rgba(239,68,68,0.06)' : 'var(--bg-secondary)',
                  borderRadius: 10, padding: 16,
                  border: `1px solid ${deleteMode && deleteSelected.has(item.id) ? 'var(--color-danger)' : 'var(--border-primary)'}`,
                  cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column',
                  gap: 8, minHeight: 120, position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!deleteMode) { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }
                }}
                onMouseLeave={e => {
                  if (!deleteMode) { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }
                }}
              >
                {deleteMode && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 4,
                    border: `2px solid ${deleteSelected.has(item.id) ? 'var(--color-danger)' : 'var(--border-primary)'}`,
                    background: deleteSelected.has(item.id) ? 'var(--color-danger)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {deleteSelected.has(item.id) && <Check size={12} color="#fff" />}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    background: item.is_completed ? '#d1fae5' : '#dbeafe',
                    color: item.is_completed ? '#065f46' : '#1e40af',
                  }}>
                    {item.is_completed ? '已完成' : '进行中'}
                  </span>
                  {!deleteMode && item.is_completed && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="#fff" />
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', lineHeight: 1.4,
                  textDecoration: item.is_completed ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                } as any}>
                  {item.title}
                </div>
                {item.description && (
                  <div style={{
                    fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4, flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  } as any}>
                    {item.description}
                  </div>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${Math.min(item.progress ?? 0, 100)}%`,
                        background: (item.progress ?? 0) >= 100 ? '#059669' : (item.progress ?? 0) >= 60 ? '#3b82f6' : (item.progress ?? 0) >= 30 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', flexShrink: 0 }}>{item.progress ?? 0}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDt(item.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TodoDetailModal
        open={detailId !== null}
        milestoneId={detailId}
        projectId={projectId}
        canEdit={canEdit}
        currentUserId={currentUserId ?? 0}
        members={members}
        onClose={() => setDetailId(null)}
        onRefresh={load}
      />

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewTitle(''); setNewDesc('') }} title="添加代办步骤">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>步骤名称 *</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="如：需求确认、UI设计、前端开发..."
              autoFocus
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>描述</label>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="步骤描述（可选）" rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setNewTitle(''); setNewDesc('') }}>取消</Button>
            <Button onClick={handleAdd} disabled={saving || !newTitle.trim()}>{saving ? '添加中...' : '添加'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showTrash} onClose={() => setShowTrash(false)} title="回收站">
        <div style={{ minHeight: 120 }}>
          {trashLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>加载中...</div>
          ) : trashItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>回收站为空</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trashItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatDt(item.created_at)}</div>
                  </div>
                  <button onClick={() => handleRestore(item.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: 'none',
                    background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
                  }}>
                    <RotateCcw size={12} /> 恢复
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
