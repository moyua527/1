import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, History, List, Plus, Trash2 } from 'lucide-react'
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

export default function TaskTitleSelector({
  label = '需求标题',
  open,
  projectId,
  value,
  onChange,
  required,
  placeholder = '输入需求标题',
}: Props) {
  const storageKey = projectId ? `task_title_mode_${projectId}` : ''
  const [mode, _setMode] = useState<'preset' | 'history'>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'history') return 'history'
    }
    return 'preset'
  })
  const setMode = (m: 'preset' | 'history') => {
    _setMode(m)
    if (storageKey) localStorage.setItem(storageKey, m)
  }
  const [options, setOptions] = useState<TaskTitleOptions>({ presets: [], history: [] })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [newPreset, setNewPreset] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)
  const presetRef = useRef<HTMLDivElement>(null)

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
        const presets = Array.isArray(r.data?.presets) ? r.data.presets : []
        const history = Array.isArray(r.data?.history) ? r.data.history : []
        setOptions({ presets, history })
        if (mode === 'history' && !value && history.length > 0) {
          onChange(history[0].title)
        }
        return
      }
      toast(r.message || '需求标题选项加载失败', 'error')
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [open, projectId])

  // 点击外部关闭下拉列表
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setInputFocused(false)
      }
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredHistory = useMemo(() => {
    if (!value.trim()) return options.history
    return options.history.filter(item => item.title.toLowerCase().includes(value.trim().toLowerCase()))
  }, [value, options.history])

  const handleAddPreset = async () => {
    const name = newPreset.trim()
    if (!name || !projectId) return
    if (options.presets.includes(name)) { toast('已存在相同名称', 'error'); return }
    setSavingPreset(true)
    const next = [...options.presets, name]
    const r = await projectApi.updateTaskTitlePresets(String(projectId), next)
    setSavingPreset(false)
    if (r.success) {
      setOptions({ ...options, presets: next })
      setNewPreset('')
      toast('已添加', 'success')
    } else toast(r.message || '添加失败', 'error')
  }

  const handleDeletePreset = async (name: string) => {
    if (!projectId) return
    setSavingPreset(true)
    const next = options.presets.filter(p => p !== name)
    const r = await projectApi.updateTaskTitlePresets(String(projectId), next)
    setSavingPreset(false)
    if (r.success) {
      setOptions({ ...options, presets: next })
      if (value === name) onChange('')
      toast('已删除', 'success')
    } else toast(r.message || '删除失败', 'error')
  }

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

      {/* 固定功能名模式 - 自定义下拉框 */}
      {mode === 'preset' && (
        loading ? (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '8px 0' }}>加载中...</div>
        ) : (
          <div ref={presetRef} style={{ position: 'relative' }}>
            <button type="button" onClick={() => setPresetOpen(v => !v)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, background: 'var(--bg-primary)', color: value ? 'var(--text-body)' : 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
              <span>{value || '-- 选择功能名 --'}</span>
              <ChevronDown size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0, transition: 'transform 0.2s', transform: presetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {presetOpen && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 280, overflowY: 'auto', zIndex: 10 }}>
                {options.presets.map(item => {
                  const selected = item === value
                  return (
                    <div key={item}
                      style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-body)', fontWeight: selected ? 600 : 400, background: selected ? 'var(--bg-selected)' : 'transparent' }}
                      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ flex: 1 }} onClick={() => { onChange(item); setPresetOpen(false) }}>{item}</span>
                      <button type="button" disabled={savingPreset}
                        onClick={e => { e.stopPropagation(); handleDeletePreset(item) }}
                        style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--text-disabled)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-disabled)' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )
                })}
                <div style={{ borderTop: '1px solid var(--border-primary)', padding: '6px 8px', display: 'flex', gap: 6 }}>
                  <input value={newPreset} onChange={e => setNewPreset(e.target.value)} placeholder="新增功能名…"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddPreset() } }}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-body)' }} />
                  <button type="button" disabled={savingPreset || !newPreset.trim()} onClick={handleAddPreset}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: savingPreset || !newPreset.trim() ? 'not-allowed' : 'pointer', opacity: savingPreset || !newPreset.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} /> 添加
                  </button>
                </div>
              </div>
            )}
          </div>
        )
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
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>创建需求后标题会自动记录到历史</div>
        </div>
      )}
    </div>
  )
}
