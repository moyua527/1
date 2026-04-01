import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { onSocket } from './smartSocket'

const typeIcon: Record<string, string> = {
  task_assigned: '📋', task_status: '🔄', task_comment: '💬',
  ticket_reply: '🎫', project_member: '📁', project_update: '📂',
  join_request: '🔑', join_approved: '✅', join_rejected: '❌',
  follow_reminder: '⏰',
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'project', label: '项目' },
  { key: 'task', label: '任务' },
  { key: 'approval', label: '审批' },
  { key: 'system', label: '系统' },
]

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [unreadByCat, setUnreadByCat] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('all')
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()

  const load = useCallback((cat?: string) => {
    const c = cat || activeTab
    fetchApi(`/api/notifications?limit=30&category=${c}`).then(r => {
      if (r.success) {
        setNotifications(r.data.notifications || [])
        setUnread(r.data.unreadCount || 0)
        if (r.data.unreadByCategory) setUnreadByCat(r.data.unreadByCategory)
      }
    })
  }, [activeTab])

  useEffect(() => {
    load()
    const offNotif = onSocket('new_notification', (data: any) => {
      setNotifications(prev => [data, ...prev].slice(0, 30))
      setUnread(prev => prev + 1)
      if (data.category) setUnreadByCat(prev => ({ ...prev, [data.category]: (prev[data.category] || 0) + 1 }))
    })
    const fallback = setInterval(load, 120000)
    return () => { clearInterval(fallback); offNotif() }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const switchTab = (cat: string) => { setActiveTab(cat); setSelected(null); load(cat) }

  const markRead = async (id: number | 'all') => {
    await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' })
    load()
  }

  const handleClick = (n: any) => {
    if (!n.is_read) markRead(n.id)
    setSelected(n)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); if (!open) load() }}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <Bell size={20} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--color-danger)', color: 'var(--bg-primary)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 380, maxHeight: 520, background: 'var(--bg-primary)', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
            {selected ? (
              <>
                <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>← 返回</button>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>通知详情</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>通知 {unread > 0 && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>({unread})</span>}</span>
                {unread > 0 && (
                  <button onClick={() => markRead('all')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                    <CheckCheck size={14} /> 全部已读
                  </button>
                )}
              </>
            )}
          </div>
          {!selected && (
            <div style={{ display: 'flex', gap: 2, padding: '6px 12px', borderBottom: '1px solid var(--border-secondary)', background: '#fafbfc' }}>
              {CATEGORIES.map(c => {
                const cnt = c.key === 'all' ? unread : (unreadByCat[c.key] || 0)
                return (
                  <button key={c.key} onClick={() => switchTab(c.key)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', position: 'relative',
                      background: activeTab === c.key ? 'var(--brand)' : 'transparent', color: activeTab === c.key ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                    {c.label}
                    {cnt > 0 && <span style={{ position: 'absolute', top: -2, right: -4, minWidth: 14, height: 14, borderRadius: 7, background: 'var(--color-danger)', color: 'var(--bg-primary)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{cnt > 9 ? '9+' : cnt}</span>}
                  </button>
                )
              })}
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {selected ? (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{typeIcon[selected.type] || '🔔'}</span>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{selected.title}</div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{selected.content}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>{new Date(selected.created_at).toLocaleString('zh-CN')}</div>
                {selected.link && (
                  <button onClick={() => { nav(selected.link); setOpen(false); setSelected(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--brand)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <ExternalLink size={14} /> 查看详情
                  </button>
                )}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>暂无通知</div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => handleClick(n)}
                style={{ display: 'flex', gap: 10, padding: '10px 16px', cursor: 'pointer', background: n.is_read ? 'transparent' : '#f0f9ff', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : '#f0f9ff')}>
                <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: 'var(--text-heading)', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{new Date(n.created_at).toLocaleString('zh-CN')}</div>
                </div>
                {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
