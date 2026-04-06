import { useState, useCallback, useEffect } from 'react'
import { Plus, Check, Circle, Trash2, Pencil } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'

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

export default function TodoTab({ projectId, canEdit, isMobile }: Props) {
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
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
      setAdding(false)
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

  const handleEditSave = async (id: number) => {
    if (!editTitle.trim()) return
    const r = await fetchApi(`/api/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() || null }),
    })
    if (r.success) { setEditingId(null); load() }
    else toast(r.message || '更新失败', 'error')
  }

  const completedCount = items.filter(i => i.is_completed).length
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* 进度概览 */}
      {items.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>项目进度</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{completedCount}/{items.length} 已完成</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4, transition: 'width 0.4s ease',
              width: `${progressPct}%`,
              background: progressPct === 100 ? '#10b981' : 'var(--brand)',
            }} />
          </div>
          {/* 步骤节点指示 */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, gap: 0 }}>
            {items.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', flex: idx < items.length - 1 ? 1 : 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  background: item.is_completed ? '#10b981' : 'var(--bg-tertiary)',
                  color: item.is_completed ? '#fff' : 'var(--text-tertiary)',
                  border: item.is_completed ? 'none' : '2px solid var(--border-primary)',
                }} title={item.title}>
                  {item.is_completed ? <Check size={12} /> : idx + 1}
                </div>
                {idx < items.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, minWidth: 12,
                    background: item.is_completed ? '#10b981' : 'var(--border-primary)',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 时间线列表 */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>项目流程</span>
          {canEdit && !adding && (
            <button onClick={() => setAdding(true)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none',
              background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              <Plus size={14} /> 添加步骤
            </button>
          )}
        </div>

        {items.length === 0 && !adding && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, marginBottom: 12 }}>暂无流程步骤</div>
            {canEdit && (
              <button onClick={() => setAdding(true)} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                添加第一个步骤
              </button>
            )}
          </div>
        )}

        {/* 时间线 */}
        <div style={{ position: 'relative' }}>
          {items.map((item, idx) => {
            const isEditing = editingId === item.id
            const isLast = idx === items.length - 1
            return (
              <div key={item.id} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: isLast ? 0 : 20 }}>
                {/* 竖线 + 圆点 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
                  <button
                    onClick={() => canEdit && handleToggle(item)}
                    disabled={!canEdit}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: canEdit ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
                      background: item.is_completed ? '#10b981' : 'var(--bg-secondary)',
                      color: item.is_completed ? '#fff' : 'var(--text-tertiary)',
                    }}>
                    {item.is_completed ? <Check size={14} /> : <Circle size={14} />}
                  </button>
                  {!isLast && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 20,
                      background: item.is_completed ? '#10b981' : 'var(--border-primary)',
                    }} />
                  )}
                </div>
                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEditSave(item.id)}
                        autoFocus
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-heading)' }} />
                      <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} placeholder="描述（可选）"
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-heading)', resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEditSave(item.id)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>保存</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600, lineHeight: 1.4,
                          color: item.is_completed ? 'var(--text-tertiary)' : 'var(--text-heading)',
                          textDecoration: item.is_completed ? 'line-through' : 'none',
                        }}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div style={{
                            fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.5,
                            textDecoration: item.is_completed ? 'line-through' : 'none',
                          }}>
                            {item.description}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          {item.is_completed && item.updated_at
                            ? `完成于 ${new Date(item.updated_at).toLocaleString('zh-CN')}`
                            : `创建于 ${new Date(item.created_at).toLocaleString('zh-CN')}`}
                        </div>
                      </div>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
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
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 添加表单 */}
        {adding && (
          <div style={{ marginTop: items.length > 0 ? 16 : 0, padding: 16, borderRadius: 10, border: '2px dashed var(--border-primary)', background: 'var(--bg-secondary)' }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="步骤名称"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
              autoFocus
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-heading)', marginBottom: 8 }} />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="步骤描述（可选）" rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-heading)', resize: 'vertical', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setAdding(false); setNewTitle(''); setNewDesc('') }}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={handleAdd} disabled={saving || !newTitle.trim()}
                style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: saving || !newTitle.trim() ? 0.5 : 1 }}>
                {saving ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
