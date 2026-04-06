import { useState, useCallback, useEffect } from 'react'
import { Plus, Check, Trash2, Pencil } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'

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
}

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '进行中' },
  { key: 'completed', label: '已完成' },
] as const

export default function TodoTab({ projectId, canEdit, isMobile }: Props) {
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<TodoItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editMode, setEditMode] = useState(false)

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

  const handleToggle = async (item: TodoItem) => {
    const r = await fetchApi(`/api/milestones/${item.id}/toggle`, { method: 'PATCH' })
    if (r.success) {
      load()
      if (selected?.id === item.id) setSelected({ ...item, is_completed: !item.is_completed })
    }
    else toast(r.message || '操作失败', 'error')
  }

  const handleDelete = async (item: TodoItem) => {
    if (!(await confirm({ message: `确定删除「${item.title}」？`, danger: true }))) return
    const r = await fetchApi(`/api/milestones/${item.id}`, { method: 'DELETE' })
    if (r.success) { toast('已删除', 'success'); setSelected(null); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleEditSave = async () => {
    if (!selected || !editTitle.trim()) return
    const r = await fetchApi(`/api/milestones/${selected.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() || null }),
    })
    if (r.success) { setEditMode(false); setSelected(null); load() }
    else toast(r.message || '更新失败', 'error')
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
    <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 顶部 */}
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

      {/* 筛选 */}
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

      {/* 卡片网格 */}
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
                onClick={() => { setSelected(item); setEditMode(false) }}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  padding: 16,
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  minHeight: 120,
                  position: 'relative',
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
                {/* 状态标签 */}
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
                {/* 标题 */}
                <div style={{
                  fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', lineHeight: 1.4,
                  textDecoration: item.is_completed ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                } as any}>
                  {item.title}
                </div>
                {/* 描述 */}
                {item.description && (
                  <div style={{
                    fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4, flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  } as any}>
                    {item.description}
                  </div>
                )}
                {/* 时间 */}
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 'auto' }}>
                  {formatDt(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setEditMode(false) }} title={editMode ? '编辑代办' : '代办详情'}>
        {selected && !editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                background: selected.is_completed ? '#d1fae5' : '#dbeafe',
                color: selected.is_completed ? '#065f46' : '#1e40af',
              }}>
                {selected.is_completed ? '已完成' : '进行中'}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>{selected.title}</h3>
            {selected.description && (
              <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selected.description}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 16 }}>
              <span>创建: {new Date(selected.created_at).toLocaleString('zh-CN')}</span>
              {selected.is_completed && selected.updated_at && (
                <span>完成: {new Date(selected.updated_at).toLocaleString('zh-CN')}</span>
              )}
            </div>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
                <Button onClick={() => handleToggle(selected)}>
                  {selected.is_completed ? '标记未完成' : '标记已完成'}
                </Button>
                <Button variant="secondary" onClick={() => {
                  setEditTitle(selected.title)
                  setEditDesc(selected.description || '')
                  setEditMode(true)
                }}>
                  <Pencil size={13} style={{ marginRight: 4 }} /> 编辑
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(selected)} style={{ color: '#ef4444' }}>
                  <Trash2 size={13} style={{ marginRight: 4 }} /> 删除
                </Button>
              </div>
            )}
          </div>
        )}
        {selected && editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>步骤名称 *</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                autoFocus
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>描述</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} placeholder="描述（可选）"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={() => setEditMode(false)}>取消</Button>
              <Button onClick={handleEditSave} disabled={!editTitle.trim()}>保存</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 创建弹窗 */}
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
