import { useEffect, useMemo, useState } from 'react'
import { History, List, Trash2 } from 'lucide-react'
import Input from '../../ui/Input'
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

  const normalizedValue = value.trim()
  const exactMatch = useMemo(() => {
    const candidates = [...options.presets, ...options.history.map(item => item.title)]
    return candidates.some(item => item === normalizedValue)
  }, [options.history, options.presets, normalizedValue])

  const filteredHistory = useMemo(() => {
    if (!normalizedValue) return options.history
    return options.history.filter(item => item.title.includes(normalizedValue))
  }, [normalizedValue, options.history])

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
      toast('历史记录已删除', 'success')
      return
    }
    toast(r.message || '删除失败', 'error')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Input label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required={required} helperText="可直接输入，也可从下方预设或历史中选择" />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setMode('preset')} style={tabButton(mode === 'preset')}>
          <List size={14} /> 固定功能名
        </button>
        <button type="button" onClick={() => setMode('history')} style={tabButton(mode === 'history')}>
          <History size={14} /> 自由输入 / 历史
        </button>
      </div>

      {mode === 'preset' && (
        <div style={panelStyle}>
          {loading ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>加载中...</div>
          ) : options.presets.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>当前项目还没有设置固定功能名，请先在项目管理中维护。</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {options.presets.map(item => {
                const active = item === value
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onChange(item)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: active ? '1px solid var(--brand)' : '1px solid var(--border-primary)',
                      background: active ? 'var(--bg-selected)' : 'var(--bg-primary)',
                      color: active ? 'var(--brand)' : 'var(--text-body)',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {mode === 'history' && (
        <div style={panelStyle}>
          {loading ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>加载中...</div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              {options.history.length === 0 ? '你还没有历史输入，直接在上方输入并创建任务后会自动记录。' : '没有匹配的历史输入。'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredHistory.map(item => {
                const active = item.title === value
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: active ? '1px solid var(--brand)' : '1px solid var(--border-primary)',
                      background: active ? 'var(--bg-selected)' : 'var(--bg-primary)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onChange(item.title)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: active ? 'var(--brand)' : 'var(--text-body)',
                      }}
                    >
                      {item.title}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteHistory(item.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-danger)',
                        cursor: deletingId === item.id ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {normalizedValue && !exactMatch && (
            <button
              type="button"
              onClick={() => onChange(normalizedValue)}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px dashed var(--brand)',
                background: 'var(--bg-primary)',
                color: 'var(--brand)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              使用“{normalizedValue}”作为新标题
            </button>
          )}
        </div>
      )}
    </div>
  )
}
