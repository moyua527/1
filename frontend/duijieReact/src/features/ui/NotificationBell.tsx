import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'
import { fetchApi } from '../../bootstrap'

const typeIcon: Record<string, string> = {
  task_assigned: '📋', task_status: '🔄', ticket_reply: '🎫', project_member: '📁', follow_reminder: '⏰',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [selected, setSelected] = useState<any>(null)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()

  const load = () => {
    fetchApi('/api/notifications?limit=30').then(r => {
      if (r.success) {
        setNotifications(r.data.notifications || [])
        setUnread(r.data.unreadCount || 0)
      }
    })
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

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
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', color: '#64748b' }}>
        <Bell size={20} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 360, maxHeight: 480, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            {selected ? (
              <>
                <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>← 返回</button>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>通知详情</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>通知 {unread > 0 && <span style={{ fontSize: 12, color: '#dc2626' }}>({unread})</span>}</span>
                {unread > 0 && (
                  <button onClick={() => markRead('all')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                    <CheckCheck size={14} /> 全部已读
                  </button>
                )}
              </>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {selected ? (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{typeIcon[selected.type] || '🔔'}</span>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{selected.title}</div>
                </div>
                <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{selected.content}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{new Date(selected.created_at).toLocaleString('zh-CN')}</div>
                {selected.link && (
                  <button onClick={() => { nav(selected.link); setOpen(false); setSelected(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <ExternalLink size={14} /> 查看相关项目
                  </button>
                )}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>暂无通知</div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => handleClick(n)}
                style={{ display: 'flex', gap: 10, padding: '10px 16px', cursor: 'pointer', background: n.is_read ? 'transparent' : '#f0f9ff', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : '#f0f9ff')}>
                <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: '#0f172a', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{new Date(n.created_at).toLocaleString('zh-CN')}</div>
                </div>
                {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 6 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
