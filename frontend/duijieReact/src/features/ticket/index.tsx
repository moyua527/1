import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Ticket, Plus, Clock, Loader2, CheckCircle, XCircle, Star } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { can } from '../../stores/permissions'
import useLiveData from '../../hooks/useLiveData'
import TicketDetail from './TicketDetail'
import TicketCreateModal from './TicketCreateModal'

const typeMap: Record<string, { label: string; color: string }> = {
  requirement: { label: '需求', color: 'var(--brand)' }, bug: { label: '问题', color: 'var(--color-danger)' },
  question: { label: '咨询', color: 'var(--color-warning)' }, other: { label: '其他', color: '#6b7280' },
}
const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: '#6b7280' }, medium: { label: '中', color: 'var(--color-warning)' },
  high: { label: '高', color: 'var(--color-orange)' }, urgent: { label: '紧急', color: 'var(--color-danger)' },
}
const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: '待处理', color: 'var(--color-warning)', icon: Clock },
  processing: { label: '处理中', color: 'var(--brand)', icon: Loader2 },
  resolved: { label: '已解决', color: 'var(--color-success)', icon: CheckCircle },
  closed: { label: '已关闭', color: '#6b7280', icon: XCircle },
}

export default function TicketPage() {
  const { user } = useOutletContext<{ user: any; isMobile: boolean }>()
  const isStaff = can(user?.role || '', 'ticket:staff')

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    fetchApi('/api/tickets').then(r => { if (r.success) setTickets(r.data || []) }).finally(() => setLoading(false))
  }
  useEffect(load, [])
  useLiveData(['ticket'], load)

  useEffect(() => {
    if (isStaff) fetchApi('/api/users').then(r => { if (r.success) setStaffMembers(r.data || []) }).catch(() => {})
  }, [isStaff])

  const openDetail = (t: any) => {
    setDetailLoading(true)
    fetchApi(`/api/tickets/${t.id}`).then(r => {
      if (r.success) setSelected(r.data)
      setDetailLoading(false)
    })
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const statusTabs = [
    { key: 'all', label: '全部', count: tickets.length },
    { key: 'open', label: '待处理', count: tickets.filter(t => t.status === 'open').length },
    { key: 'processing', label: '处理中', count: tickets.filter(t => t.status === 'processing').length },
    { key: 'resolved', label: '已解决', count: tickets.filter(t => t.status === 'resolved').length },
    { key: 'closed', label: '已关闭', count: tickets.filter(t => t.status === 'closed').length },
  ]

  if (selected && !detailLoading) {
    return <TicketDetail ticket={selected} user={user} staffMembers={staffMembers} onBack={() => setSelected(null)} onRefresh={load} onReloadDetail={openDetail} />
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>工单</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>{isStaff ? '管理工单' : '提交需求或问题'}</p>
        </div>
        <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'var(--brand)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <Plus size={16} /> 新建工单
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {statusTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + (filter === tab.key ? 'var(--brand)' : 'var(--border-primary)'),
              background: filter === tab.key ? 'var(--bg-selected)' : 'var(--bg-primary)', color: filter === tab.key ? 'var(--brand)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab.label}
            {tab.count > 0 && <span style={{ fontSize: 11, padding: '0 6px', borderRadius: 8, background: filter === tab.key ? 'var(--brand)' : 'var(--border-primary)', color: filter === tab.key ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
          <Ticket size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div style={{ fontSize: 15 }}>暂无工单</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const st = statusMap[t.status] || statusMap.open
            const tp = typeMap[t.type] || typeMap.other
            const pr = priorityMap[t.priority] || priorityMap.medium
            const StIcon = st.icon
            return (
              <div key={t.id} onClick={() => openDetail(t)}
                style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: st.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><StIcon size={18} color={st.color} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{t.title}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: tp.color + '18', color: tp.color }}>{tp.label}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: pr.color + '18', color: pr.color }}>{pr.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>#{t.id}</span>
                    <span>{t.creator_name || t.creator_username}</span>
                    {t.project_name && <span>{t.project_name}</span>}
                    <span>{new Date(t.created_at).toLocaleDateString('zh-CN')}</span>
                    {t.reply_count > 0 && <span>{t.reply_count} 条回复</span>}
                    {t.rating && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={10} color="var(--color-warning)" fill="#d97706" />{t.rating}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: st.color + '18', color: st.color, fontWeight: 500, flexShrink: 0 }}>{st.label}</div>
              </div>
            )
          })}
        </div>
      )}

      <TicketCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  )
}
