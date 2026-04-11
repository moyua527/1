import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, Filter } from 'lucide-react'
import Avatar from '../../ui/Avatar'

const TYPE_LABELS: Record<string, string> = {
  task_created: '创建了需求',
  task_status: '变更了需求状态',
  task_deleted: '删除了需求',
  member_added: '添加了成员',
  member_removed: '移除了成员',
  member_joined: '加入了项目',
  file_uploaded: '上传了文件',
  file_deleted: '删除了文件',
  message_sent: '发送了消息',
  milestone_done: '完成了代办',
  project_updated: '更新了项目',
}

const TYPE_COLORS: Record<string, string> = {
  task_created: '#3b82f6',
  task_status: '#8b5cf6',
  task_deleted: '#ef4444',
  member_added: '#10b981',
  member_removed: '#f59e0b',
  member_joined: '#10b981',
  file_uploaded: '#06b6d4',
  file_deleted: '#f97316',
  message_sent: '#6366f1',
  milestone_done: '#14b8a6',
  project_updated: '#64748b',
}

const FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'task_created', label: '需求创建' },
  { value: 'task_status', label: '状态变更' },
  { value: 'member_added', label: '成员变动' },
  { value: 'file_uploaded', label: '文件操作' },
  { value: 'project_updated', label: '项目更新' },
]

export default function ProjectActivityTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const loadedRef = useRef(false)

  const load = useCallback(() => {
    setLoading(true)
    const url = filter
      ? `/api/projects/${projectId}/activity?limit=100&type=${filter}`
      : `/api/projects/${projectId}/activity?limit=100`
    import('../../../bootstrap').then(({ fetchApi }) => {
      fetchApi(url).then((r: any) => {
        if (r.success) setItems(r.data || [])
        setLoading(false)
      })
    })
  }, [projectId, filter])

  useEffect(() => {
    load()
    loadedRef.current = true
  }, [load])

  const grouped = groupByDate(items)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header + Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="var(--brand)" />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>项目动态</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({items.length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} color="var(--text-tertiary)" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
          >
            {FILTER_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>加载中...</div>}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无动态记录</div>
      )}

      {!loading && Object.keys(grouped).map(date => (
        <div key={date}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', opacity: 0.5 }} />
            {date}
          </div>
          <div style={{ borderLeft: '2px solid var(--border-primary)', marginLeft: 3, paddingLeft: 20 }}>
            {grouped[date].map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', left: -26, top: 14, width: 10, height: 10, borderRadius: '50%', background: TYPE_COLORS[item.type] || '#94a3b8', border: '2px solid var(--bg-primary)' }} />
                <Avatar name={item.actor_name || '?'} src={item.actor_avatar} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>{item.actor_name}</span>
                    <span style={{ color: TYPE_COLORS[item.type] || 'var(--text-secondary)', fontWeight: 500 }}> {TYPE_LABELS[item.type] || item.type} </span>
                    {item.title && <span style={{ fontWeight: 500 }}>「{item.title}」</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatFullTime(item.happened_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByDate(items: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}
  const today = new Date()
  const todayStr = fmtDate(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = fmtDate(yesterday)

  for (const item of items) {
    const d = fmtDate(new Date(item.happened_at))
    let label = d
    if (d === todayStr) label = '今天'
    else if (d === yesterdayStr) label = '昨天'
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }
  return groups
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatFullTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
