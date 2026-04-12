import { useState, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, ExternalLink, Trash2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useNotifications, useInvalidate } from '../../hooks/useApi'
import PageHeader from '../ui/PageHeader'
import { typeIcon } from './constants'

export default function NotificationCenter() {
  const { data, isLoading: loading } = useNotifications('all')
  const invalidate = useInvalidate()
  const notifications = data?.notifications || []
  const unread = data?.unreadCount || 0
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const nav = useNavigate()
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const markRead = async (id: number | 'all') => {
    try {
      await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' })
      invalidate('notifications')
    } catch { /* network error */ }
  }

  const deleteNotif = async (id: number | 'all', e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await fetchApi(`/api/notifications/${id}`, { method: 'DELETE' })
      if (selected?.id === id || id === 'all') setSelected(null)
      invalidate('notifications')
    } catch { /* network error */ }
  }

  const handleClick = (n: any) => {
    if (!n.is_read) markRead(n.id)
    setSelected(n)
  }

  const displayed = useMemo(() => filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications, [notifications, filter])

  const actionBtns = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 2 }}>
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer',
              background: filter === f ? 'var(--bg-primary)' : 'transparent',
              color: filter === f ? 'var(--brand)' : 'var(--text-tertiary)',
              fontWeight: filter === f ? 600 : 400, boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}>
            {f === 'all' ? '全部' : `未读${unread > 0 ? ` (${unread})` : ''}`}
          </button>
        ))}
      </div>
      {unread > 0 && (
        <button onClick={() => markRead('all')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
          <CheckCheck size={14} /> 全部已读
        </button>
      )}
      {notifications.length > 0 && (
        <button onClick={() => deleteNotif('all')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--color-danger, #ef4444)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
          <Trash2 size={14} /> 清空
        </button>
      )}
    </div>
  )

  const renderItem = (n: any, isLast: boolean) => (
    <div key={n.id} onClick={() => handleClick(n)}
      style={{
        display: 'flex', gap: isMobile ? 10 : 12, padding: isMobile ? '12px 14px' : '14px 16px', cursor: 'pointer',
        background: n.is_read ? 'transparent' : 'var(--bg-selected)',
        borderBottom: isLast ? 'none' : '1px solid var(--border-secondary)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--bg-selected)')}>
      <span style={{ fontSize: isMobile ? 20 : 24, lineHeight: 1.2, flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: n.is_read ? 400 : 600, color: 'var(--text-heading)', marginBottom: 3 }}>{n.title}</div>
        <div style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{new Date(n.created_at).toLocaleString('zh-CN')}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
        <button onClick={(e) => deleteNotif(n.id, e)} title="删除"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, opacity: 0.5, transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title="通知中心" subtitle={`共 ${notifications.length} 条通知${unread > 0 ? ` · ${unread} 条未读` : ''}`} actions={actionBtns} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : !selected ? (
        displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? 60 : 80, color: 'var(--text-tertiary)', background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)' }}>
            <Bell size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>{filter === 'unread' ? '没有未读通知' : '暂无通知'}</div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
            {displayed.map((n, i) => renderItem(n, i === displayed.length - 1))}
          </div>
        )
      ) : (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', padding: isMobile ? 16 : 24 }}>
          <button onClick={() => setSelected(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 16 }}>
            ← 返回列表
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>{typeIcon[selected.type] || '🔔'}</span>
            <div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'var(--text-heading)' }}>{selected.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{new Date(selected.created_at).toLocaleString('zh-CN')}</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{selected.content}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.link && (
              <button onClick={() => nav(selected.link)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <ExternalLink size={14} /> 查看详情
              </button>
            )}
            <button onClick={() => deleteNotif(selected.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--color-danger, #ef4444)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <Trash2 size={14} /> 删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
