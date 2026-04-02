import { useEffect, useMemo, useRef, useState } from 'react'
import { History, List, Trash2, Plus, X } from 'lucide-react'
import { projectApi } from '../../project/services/api'
import { toast } from '../../ui/Toast'

interface TaskTitleHistoryItem {
  id: number
  title: string
  last_used_at?: string
}

interface TaskTitleOptions {
  presets: string[]
  history: TaskTitleHistoryItem[]
}

interface Props {
  label?: string
  open: boolean
  projectId?: string | number | null
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

const tabButton = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 999,
  border: active ? '1px solid var(--brand)' : '1px solid var(--border-primary)',
  background: active ? 'var(--bg-selected)' : 'var(--bg-primary)',
  color: active ? 'var(--brand)' : 'var(--text-secondary)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
})

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--border-primary)',
  borderRadius: 12,
  background: 'var(--bg-secondary)',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

export default function TaskTitleSelector({
  label = '任务标题',
  open,
  projectId,
  value,
  onChange,
  required,
  placeholder = '输入任务标题',
}: Props) {
  const [mode, setMode] = useState<'preset' | 'history'>('preset')
  const [options, setOptions] = useState<TaskTitleOptions>({ presets: [], history: [] })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [newPreset, setNewPreset] = useState('')
  const [addingPreset, setAddingPreset] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    const timer = window.setTimeout(async () => {
      if (!active) return
      if (!projectId) {
        setOptions({ presets: [], history: [] })
        setLoading(false)
        return
      }
      setLoading(true)
      const r = await projectApi.taskTitleOptions(String(projectId))
      if (!active) return
      setLoading(false)
      if (r.success) {
        setOptions({
          presets: Array.isArray(r.data?.presets) ? r.data.presets : [],
          history: Array.isArray(r.data?.history) ? r.data.history : [],
        })
        return
      }
      toast(r.message || '任务标题选项加载失败', 'error')
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [open, projectId])

  // 点击外部关闭建议列表
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setInputFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredHistory = useMemo(() => {
    if (!value.trim()) return options.history
    return options.history.filter(item => item.title.toLowerCase().includes(value.trim().toLowerCase()))
  }, [value, options.history])

  const handleDeleteHistory = async (id: number) => {
    if (!projectId) return
    setDeletingId(id)
    const r = await projectApi.deleteTaskTitleHistory(String(projectId), id)
    setDeletingId(null)
    if (r.success) {
      setOptions({
        presets: Array.isArray(r.data?.presets) ? r.data.presets : options.presets,
        history: Array.isArray(r.data?.history) ? r.data.history : [],
      })
      return
    }
    toast(r.message || '删除失败', 'error')
  }

  const handleAddPreset = async () => {
    const name = newPreset.trim()
    if (!name) { toast('请输入功能名', 'error'); return }
    if (!projectId) return
    if (options.presets.includes(name)) { toast('已存在相同名称', 'error'); return }
    setAddingPreset(true)
    const updated = [...options.presets, name]
    // 先乐观更新本地状态
    setOptions(prev => ({ ...prev, presets: updated }))
    setNewPreset('')
    // 后台保存（用专用端点，不触发广播）
    const r = await projectApi.updateTaskTitlePresets(String(projectId), updated)
    setAddingPreset(false)
    if (r.success) {
      toast('已添加', 'success')
    } else {
      // 回滚
      setOptions(prev => ({ ...prev, presets: prev.presets.filter(p => p !== name) }))
      toast(r.message || '添加失败', 'error')
    }
  }

  const handleRemovePreset = async (name: string) => {
    if (!projectId) return
    const updated = options.presets.filter(p => p !== name)
    // 乐观更新
    setOptions(prev => ({ ...prev, presets: updated }))
    const r = await projectApi.updateTaskTitlePresets(String(projectId), updated)
    if (r.success) {
      toast('已移除', 'success')
    } else {
      setOptions(prev => ({ ...prev, presets: [...prev.presets, name] }))
      toast(r.message || '移除失败', 'error')
    }
  }

  // 自由输入模式下是否显示建议
  const showSuggestions = mode === 'history' && inputFocused && filteredHistory.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)' }}>
        {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>

      {/* 模式切换 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setMode('preset')} style={tabButton(mode === 'preset')}>
          <List size={14} /> 固定功能名
        </button>
        <button type="button" onClick={() => setMode('history')} style={tabButton(mode === 'history')}>
          <History size={14} /> 自由输入
        </button>
      </div>

      {/* 固定功能名模式 */}
      {mode === 'preset' && (
        <div style={panelStyle}>
          {loading ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>加载中...</div>
          ) : (
            <>
              {/* 已选标题显示 */}
              {value && (
                <div style={{ fontSize: 13, color: 'var(--text-heading)', padding: '6px 0', borderBottom: '1px solid var(--border-primary)', marginBottom: 4 }}>
                  已选：<strong>{value}</strong>
                </div>
              )}
              {/* 预设列表 */}
              {options.presets.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {options.presets.map(item => {
                    const active = item === value
                    return (
                      <div key={item} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 8, border: active ? '1px solid var(--brand)' : '1px solid var(--border-primary)', background: active ? 'var(--bg-selected)' : 'var(--bg-primary)', overflow: 'hidden' }}>
                        <button type="button" onClick={() => onChange(item)}
                          style={{ padding: '7px 8px 7px 12px', border: 'none', background: 'none', color: active ? 'var(--brand)' : 'var(--text-body)', fontSize: 13, cursor: 'pointer' }}>
                          {item}
                        </button>
                        <button type="button" onClick={() => handleRemovePreset(item)}
                          style={{ padding: '4px 6px', border: 'none', background: 'none', color: 'var(--text-disabled)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-disabled)' }}>
                          <X size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* 添加新预设 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input value={newPreset} onChange={e => setNewPreset(e.target.value)} placeholder="添加新的固定功能名"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPreset() } }}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
                <button type="button" onClick={handleAddPreset} disabled={addingPreset}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--brand)', background: 'none', color: 'var(--brand)', fontSize: 12, fontWeight: 500, cursor: addingPreset ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                  <Plus size={12} /> 添加
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 自由输入模式 - 类似浏览器搜索自动补全 */}
      {mode === 'history' && (
        <div ref={suggestRef} style={{ position: 'relative' }}>
          <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            onFocus={() => setInputFocused(true)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)', boxSizing: 'border-box' }} />
          {/* 历史记录建议下拉 */}
          {showSuggestions && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto', zIndex: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-disabled)', padding: '6px 12px 2px', fontWeight: 500 }}>历史记录</div>
              {filteredHistory.map(item => {
                const active = item.title === value
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', cursor: 'pointer', background: active ? 'var(--bg-selected)' : 'transparent' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                    <button type="button" onClick={() => { onChange(item.title); setInputFocused(false) }}
                      style={{ flex: 1, textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: active ? 'var(--brand)' : 'var(--text-body)', padding: 0 }}>
                      {item.title}
                    </button>
                    <button type="button" disabled={deletingId === item.id} onClick={e => { e.stopPropagation(); handleDeleteHistory(item.id) }}
                      style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--text-disabled)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-disabled)' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>创建任务后标题会自动记录到历史</div>
        </div>
      )}
    </div>
  )
}
