import { useState, useCallback, useEffect } from 'react'
import { Plus, Check } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import { toast } from '../../ui/Toast'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import TodoDetailModal from './TodoDetailModal'

interface TodoItem {
  id: number
  title: string
  description?: string
  is_completed: boolean
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

  const load = useCallback(() => {
    fetchApi(`/api/milestones?project_id=${projectId}`).then(r => {
      if (r.success) setItems((r.data || []).sort((a: TodoItem, b: TodoItem) => a.sort_order - b.sort_order))
      setLoading(false)
    })
  }, [projectId])

  useEffect(() => { load() }, [load])

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
    <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>代办</h2>
        {canEdit && (
          <button onClick={() => setShowCreate(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: 'none',
            background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            <Plus size={14} /> 新增
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
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
                onClick={() => setDetailId(item.id)}
                style={{
                  background: 'var(--bg-secondary)', borderRadius: 10, padding: 16,
                  border: '1px solid var(--border-primary)', cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', flexDirection: 'column',
                  gap: 8, minHeight: 120, position: 'relative',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--brand)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    background: item.is_completed ? '#d1fae5' : '#dbeafe',
                    color: item.is_completed ? '#065f46' : '#1e40af',
                  }}>
                    {item.is_completed ? '已完成' : '进行中'}
                  </span>
                  {item.is_completed && (
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
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 'auto' }}>
                  {formatDt(item.created_at)}
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
    </div>
  )
}
