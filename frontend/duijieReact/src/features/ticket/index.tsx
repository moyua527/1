import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Ticket, Plus, Send, Star, ChevronLeft, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, User } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'

const typeMap: Record<string, { label: string; color: string }> = {
  requirement: { label: '需求', color: '#2563eb' }, bug: { label: '问题', color: '#dc2626' },
  question: { label: '咨询', color: '#d97706' }, other: { label: '其他', color: '#6b7280' },
}
const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: '#6b7280' }, medium: { label: '中', color: '#d97706' },
  high: { label: '高', color: '#ea580c' }, urgent: { label: '紧急', color: '#dc2626' },
}
const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: '待处理', color: '#d97706', icon: Clock },
  processing: { label: '处理中', color: '#2563eb', icon: Loader2 },
  resolved: { label: '已解决', color: '#16a34a', icon: CheckCircle },
  closed: { label: '已关闭', color: '#6b7280', icon: XCircle },
}

const ticketApi = {
  list: () => fetchApi('/api/tickets'),
  detail: (id: number) => fetchApi(`/api/tickets/${id}`),
  create: (d: any) => fetchApi('/api/tickets', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: number, d: any) => fetchApi(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  reply: (id: number, content: string) => fetchApi(`/api/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),
  rate: (id: number, rating: number, rating_comment: string) => fetchApi(`/api/tickets/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, rating_comment }) }),
}

export default function TicketPage() {
  const { user, isMobile } = useOutletContext<{ user: any; isMobile: boolean }>()
  const isClient = user?.role === 'client'
  const isStaff = ['admin', 'tech', 'business', 'member'].includes(user?.role)

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'question', priority: 'medium', project_id: '' })
  const [projects, setProjects] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('all')
  const [rateOpen, setRateOpen] = useState(false)
  const [rateForm, setRateForm] = useState({ rating: 5, comment: '' })
  const repliesEndRef = useRef<HTMLDivElement>(null)

  const load = () => {
    setLoading(true)
    ticketApi.list().then(r => { if (r.success) setTickets(r.data || []) }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openDetail = (t: any) => {
    setDetailLoading(true)
    ticketApi.detail(t.id).then(r => {
      if (r.success) setSelected(r.data)
      setDetailLoading(false)
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
  }

  const openCreate = () => {
    setForm({ title: '', content: '', type: 'question', priority: 'medium', project_id: '' })
    fetchApi('/api/projects').then(r => { if (r.success) setProjects(r.data || []) })
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!form.title.trim()) { toast('标题必填', 'error'); return }
    const r = await ticketApi.create({ ...form, project_id: form.project_id ? Number(form.project_id) : null })
    if (r.success) { toast('工单已提交', 'success'); setCreateOpen(false); load() }
    else toast(r.message || '提交失败', 'error')
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return
    setSending(true)
    const r = await ticketApi.reply(selected.id, replyText.trim())
    setSending(false)
    if (r.success) { setReplyText(''); openDetail(selected); load() }
    else toast(r.message || '回复失败', 'error')
  }

  const handleStatusChange = async (status: string) => {
    if (!selected) return
    const r = await ticketApi.update(selected.id, { status })
    if (r.success) { openDetail(selected); load() }
  }

  const handleAssign = async (assigned_to: number) => {
    if (!selected) return
    const r = await ticketApi.update(selected.id, { assigned_to })
    if (r.success) { openDetail(selected); load() }
  }

  const openRate = () => {
    setRateForm({ rating: 5, comment: '' })
    setRateOpen(true)
  }

  const handleRate = async () => {
    if (!selected) return
    const r = await ticketApi.rate(selected.id, rateForm.rating, rateForm.comment)
    if (r.success) { toast('评价成功', 'success'); setRateOpen(false); openDetail(selected); load() }
    else toast(r.message || '评价失败', 'error')
  }

  useEffect(() => {
    if (isStaff) fetchApi('/api/users').then(r => { if (r.success) setStaffMembers(r.data || []) }).catch(() => {})
  }, [isStaff])

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const statusTabs = [
    { key: 'all', label: '全部', count: tickets.length },
    { key: 'open', label: '待处理', count: tickets.filter(t => t.status === 'open').length },
    { key: 'processing', label: '处理中', count: tickets.filter(t => t.status === 'processing').length },
    { key: 'resolved', label: '已解决', count: tickets.filter(t => t.status === 'resolved').length },
    { key: 'closed', label: '已关闭', count: tickets.filter(t => t.status === 'closed').length },
  ]

  // Detail view
  if (selected && !detailLoading) {
    const st = statusMap[selected.status] || statusMap.open
    const StIcon = st.icon
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, marginBottom: 16, padding: 0 }}>
          <ChevronLeft size={16} /> 返回列表
        </button>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{selected.title}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: st.color + '18', color: st.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><StIcon size={12} />{st.label}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: (typeMap[selected.type]?.color || '#6b7280') + '18', color: typeMap[selected.type]?.color || '#6b7280' }}>{typeMap[selected.type]?.label || selected.type}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: (priorityMap[selected.priority]?.color || '#6b7280') + '18', color: priorityMap[selected.priority]?.color || '#6b7280' }}>{priorityMap[selected.priority]?.label || selected.priority}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {isStaff && selected.status === 'open' && <button onClick={() => handleStatusChange('processing')} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>开始处理</button>}
              {isStaff && selected.status === 'processing' && <button onClick={() => handleStatusChange('resolved')} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}>标记解决</button>}
              {isClient && (selected.status === 'resolved') && !selected.rating && <button onClick={openRate} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} />评价</button>}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>提交者：{selected.creator_name || selected.creator_username}</span>
            {selected.assignee_name && <span>处理人：{selected.assignee_name || selected.assignee_username}</span>}
            {selected.project_name && <span>项目：{selected.project_name}</span>}
            <span>{new Date(selected.created_at).toLocaleString('zh-CN')}</span>
          </div>
          {isStaff && !selected.assigned_to && staffMembers.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>分配给：</span>
              <select onChange={e => handleAssign(Number(e.target.value))} defaultValue="" style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <option value="" disabled>选择处理人</option>
                {staffMembers.map((m: any) => <option key={m.id} value={m.id}>{m.nickname || m.username}</option>)}
              </select>
            </div>
          )}
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{selected.content || '(无描述)'}</div>

          {/* Rating display */}
          {selected.rating && (
            <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={16} color="#d97706" fill={i <= selected.rating ? '#d97706' : 'none'} />)}
              </div>
              {selected.rating_comment && <span style={{ fontSize: 13, color: '#92400e' }}>{selected.rating_comment}</span>}
            </div>
          )}

          {/* Replies */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>回复 ({selected.replies?.length || 0})</div>
            {(selected.replies || []).map((r: any) => {
              const isMe = r.created_by === user?.id
              return (
                <div key={r.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <Avatar name={r.creator_name || r.creator_username} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.creator_name || r.creator_username}</span>
                      {r.creator_role && r.creator_role !== 'client' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>工作人员</span>}
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.content}</div>
                  </div>
                </div>
              )
            })}
            <div ref={repliesEndRef} />
          </div>

          {/* Reply input */}
          {selected.status !== 'closed' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="输入回复..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc' }} />
              <button onClick={handleReply} disabled={sending || !replyText.trim()}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, opacity: !replyText.trim() ? 0.5 : 1 }}>
                <Send size={16} /> 回复
              </button>
            </div>
          )}
        </div>

        {/* Rate modal */}
        <Modal open={rateOpen} onClose={() => setRateOpen(false)} title="评价工单服务">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>满意度评分</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={() => setRateForm({ ...rateForm, rating: i })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Star size={32} color="#d97706" fill={i <= rateForm.rating ? '#d97706' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>评价内容（选填）</div>
              <textarea value={rateForm.comment} onChange={e => setRateForm({ ...rateForm, comment: e.target.value })}
                placeholder="请输入您的评价..." rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={() => setRateOpen(false)}>取消</Button>
              <Button onClick={handleRate}>提交评价</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // List view
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>工单</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{isClient ? '提交需求或问题' : '管理客户工单'}</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <Plus size={16} /> 新建工单
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {statusTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + (filter === tab.key ? '#2563eb' : '#e2e8f0'),
              background: filter === tab.key ? '#eff6ff' : '#fff', color: filter === tab.key ? '#2563eb' : '#64748b',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab.label}
            {tab.count > 0 && <span style={{ fontSize: 11, padding: '0 6px', borderRadius: 8, background: filter === tab.key ? '#2563eb' : '#e2e8f0', color: filter === tab.key ? '#fff' : '#64748b' }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
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
                style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: st.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StIcon size={18} color={st.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{t.title}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: tp.color + '18', color: tp.color }}>{tp.label}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: pr.color + '18', color: pr.color }}>{pr.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>#{t.id}</span>
                    <span>{t.creator_name || t.creator_username}</span>
                    {t.project_name && <span>{t.project_name}</span>}
                    <span>{new Date(t.created_at).toLocaleDateString('zh-CN')}</span>
                    {t.reply_count > 0 && <span>{t.reply_count} 条回复</span>}
                    {t.rating && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={10} color="#d97706" fill="#d97706" />{t.rating}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: st.color + '18', color: st.color, fontWeight: 500, flexShrink: 0 }}>{st.label}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建工单">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="标题" placeholder="简要描述您的需求或问题" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>详细描述</div>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="请详细描述..." rows={4}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>类型</div>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
                <option value="question">咨询</option>
                <option value="requirement">需求</option>
                <option value="bug">问题</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>优先级</div>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>
          {projects.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>关联项目（选填）</div>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
                <option value="">不关联</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate}>提交工单</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
