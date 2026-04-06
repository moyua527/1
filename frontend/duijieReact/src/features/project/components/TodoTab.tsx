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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')

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
    if (r.success) load()
    else toast(r.message || '操作失败', 'error')
  }

  const handleDelete = async (item: TodoItem) => {
    if (!(await confirm({ message: `确定删除「${item.title}」？`, danger: true }))) return
    const r = await fetchApi(`/api/milestones/${item.id}`, { method: 'DELETE' })
    if (r.success) { toast('已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleEditSave = async () => {
    if (!editingId || !editTitle.trim()) return
    const r = await fetchApi(`/api/milestones/${editingId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() || null }),
    })
    if (r.success) { setEditingId(null); load() }
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
    try { return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) } catch { return d }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>代办列表</h2>
        {canEdit && (
          <button onClick={() => setShowCreate(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: 'none',
            background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            <Plus size={14} /> 添加
          </button>
        )}
      </div>

      {/* 状态筛选栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexShrink: 0, flexWrap: 'wrap' }}>
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

      {/* 流程说明 */}
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, flexShrink: 0 }}>
        流程: 创建步骤 → 逐步完成 → 项目上线
      </div>

      {/* 列表 */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>
            {items.length === 0 ? '暂无代办步骤' : '当前筛选无结果'}
          </div>
        ) : filtered.map((item, idx) => {
          const isEditing = editingId === item.id
          const statusStyle = item.is_completed
            ? { bg: '#d1fae5', color: '#065f46', label: '已完成' }
            : { bg: '#dbeafe', color: '#1e40af', label: '进行中' }

          return (
            <div key={item.id} style={{ background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'visible' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
                {/* 完成按钮 */}
                {canEdit && (
                  <button onClick={() => handleToggle(item)} style={{
                    width: 22, height: 22, borderRadius: '50%', border: item.is_completed ? 'none' : '2px solid var(--border-primary)',
                    background: item.is_completed ? '#10b981' : 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
                    color: item.is_completed ? '#fff' : 'var(--text-tertiary)',
                  }}>
                    {item.is_completed && <Check size={12} />}
                  </button>
                )}
                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditingId(null) }}
                        autoFocus
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--brand)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-heading)' }} />
                      <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} placeholder="描述（可选）"
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-heading)', resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleEditSave} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>保存</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 14, fontWeight: 500,
                          color: item.is_completed ? 'var(--text-tertiary)' : 'var(--text-heading)',
                          textDecoration: item.is_completed ? 'line-through' : 'none',
                        }}>{item.title}</span>
                      </div>
                      {item.description && (
                        <div style={{
                          fontSize: 13, color: 'var(--text-secondary)', marginTop: 2,
                          textDecoration: item.is_completed ? 'line-through' : 'none',
                        }}>{item.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          创建: {formatDt(item.created_at)}
                        </span>
                        {item.is_completed && item.updated_at && (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            完成: {formatDt(item.updated_at)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {/* 状态 + 操作 */}
                {!isEditing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                      background: statusStyle.bg, color: statusStyle.color,
                      border: '1px solid var(--border-primary)',
                    }}>
                      {statusStyle.label}
                    </span>
                    {canEdit && (
                      <>
                        <button onClick={() => { setEditingId(item.id); setEditTitle(item.title); setEditDesc(item.description || '') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(item)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

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
