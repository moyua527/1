import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, ExternalLink, Trash2, Filter } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useNavigate } from 'react-router-dom'

const typeIcon: Record<string, string> = {
  task_assigned: '📋', task_status: '🔄', task_comment: '💬',
  ticket_reply: '🎫', project_member: '📁', project_update: '📂',
  join_request: '🔑', join_approved: '✅', join_rejected: '❌',
  follow_reminder: '⏰',
}

const CATEGORIES = [
  { key: 'all', label: '全部', icon: '📮' },
  { key: 'project', label: '项目', icon: '📁' },
  { key: 'task', label: '任务', icon: '📋' },
  { key: 'approval', label: '审批', icon: '✅' },
  { key: 'system', label: '系统', icon: '⚙️' },
]

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)
  const [unreadByCat, setUnreadByCat] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const nav = useNavigate()
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const load = useCallback((cat?: string) => {
    setLoading(true)
    const c = cat || activeTab
    fetchApi(`/api/notifications?limit=100&category=${c}`).then(r => {
      if (r.success) {
        setNotifications(r.data.notifications || [])
        setUnread(r.data.unreadCount || 0)
        if (r.data.unreadByCategory) setUnreadByCat(r.data.unreadByCategory)
      }
    }).finally(() => setLoading(false))
  }, [activeTab])

  useEffect(() => { load() }, [])

  const switchTab = (cat: string) => { setActiveTab(cat); setSelected(null); load(cat) }

  const markRead = async (id: number | 'all') => {
    await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' })
    load()
  }

  const handleClick = (n: any) => {
    if (!n.is_read) markRead(n.id)
    setSelected(n)
  }

  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>通知中心</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
            共 {notifications.length} 条通知 {unread > 0 && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>· {unread} 条未读</span>}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={() => markRead('all')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            <CheckCheck size={16} /> 全部已读
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* 左侧分类 */}
        <div style={{ width: isMobile ? '100%' : 200, flexShrink: 0 }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
            {CATEGORIES.map(c => {
              const cnt = c.key === 'all' ? unread : (unreadByCat[c.key] || 0)
              return (
                <div key={c.key} onClick={() => switchTab(c.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer',
                    background: activeTab === c.key ? 'var(--bg-selected)' : 'transparent',
                    color: activeTab === c.key ? 'var(--brand)' : 'var(--text-body)',
                    fontWeight: activeTab === c.key ? 600 : 400, fontSize: 13,
                    borderLeft: activeTab === c.key ? '3px solid var(--brand)' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (activeTab !== c.key) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (activeTab !== c.key) e.currentTarget.style.background = 'transparent' }}>
                  <span>{c.icon}</span>
                  <span style={{ flex: 1 }}>{c.label}</span>
                  {cnt > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{cnt > 99 ? '99+' : cnt}</span>}
                </div>
              )
            })}
          </div>

          {/* 过滤选项 */}
          <div style={{ marginTop: 12, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', padding: '8px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', padding: '4px 8px', marginBottom: 4 }}>
              <Filter size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />筛选
            </div>
            {['all', 'unread'].map(f => (
              <div key={f} onClick={() => setFilter(f as any)}
                style={{
                  padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                  background: filter === f ? 'var(--bg-selected)' : 'transparent',
                  color: filter === f ? 'var(--brand)' : 'var(--text-secondary)',
                  fontWeight: filter === f ? 600 : 400,
                }}>
                {f === 'all' ? '全部通知' : '仅未读'}
              </div>
            ))}
          </div>
        </div>

        {/* 通知列表 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : !selected ? (
            displayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)', background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)' }}>
                <Bell size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div>{filter === 'unread' ? '没有未读通知' : '暂无通知'}</div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
                {displayed.map((n, i) => (
                  <div key={n.id} onClick={() => handleClick(n)}
                    style={{
                      display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer',
                      background: n.is_read ? 'transparent' : 'var(--bg-selected)',
                      borderBottom: i < displayed.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--bg-selected)')}>
                    <span style={{ fontSize: 24, lineHeight: 1.2, flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 600, color: 'var(--text-heading)', marginBottom: 4 }}>{n.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('zh-CN')}</div>
                    </div>
                    {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 8 }} />}
                  </div>
                ))}
              </div>
            )
          ) : (
            /* 详情视图 */
            <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', padding: 24 }}>
              <button onClick={() => setSelected(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 16 }}>
                ← 返回列表
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>{typeIcon[selected.type] || '🔔'}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>{selected.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {new Date(selected.created_at).toLocaleString('zh-CN')}
                    {selected.category && <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-secondary)', fontSize: 11 }}>{selected.category}</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{selected.content}</div>
              {selected.link && (
                <button onClick={() => nav(selected.link)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <ExternalLink size={14} /> 查看详情
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
