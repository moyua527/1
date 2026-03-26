import { useState, useRef } from 'react'
import { Send, Star, ChevronLeft, Clock, Loader2, CheckCircle, XCircle, Paperclip, Download, X } from 'lucide-react'
import { fetchApi, uploadFile, BACKEND_URL } from '../../bootstrap'
import { can } from '../../stores/permissions'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
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
const fmtSize = (b: number) => b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'

interface Props {
  ticket: any; user: any; staffMembers: any[]
  onBack: () => void; onRefresh: () => void; onReloadDetail: (t: any) => void
}

export default function TicketDetail({ ticket, user, staffMembers, onBack, onRefresh, onReloadDetail }: Props) {
  const isStaff = can(user?.role || '', 'ticket:staff')
  const [replyText, setReplyText] = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [rateOpen, setRateOpen] = useState(false)
  const [rateForm, setRateForm] = useState({ rating: 5, comment: '' })
  const replyFileRef = useRef<HTMLInputElement>(null)
  const repliesEndRef = useRef<HTMLDivElement>(null)

  const handleReply = async () => {
    if (!replyText.trim() && replyFiles.length === 0) return
    setSending(true)
    const fd = new FormData()
    fd.append('content', replyText.trim())
    replyFiles.forEach(f => fd.append('files', f))
    const r = await uploadFile(`/api/tickets/${ticket.id}/reply`, fd)
    setSending(false)
    if (r.success) { setReplyText(''); setReplyFiles([]); onReloadDetail(ticket); onRefresh() }
    else toast(r.message || '回复失败', 'error')
  }

  const handleStatusChange = async (status: string) => {
    const r = await fetchApi(`/api/tickets/${ticket.id}`, { method: 'PUT', body: JSON.stringify({ status }) })
    if (r.success) { onReloadDetail(ticket); onRefresh() }
  }

  const handleAssign = async (assigned_to: number) => {
    const r = await fetchApi(`/api/tickets/${ticket.id}`, { method: 'PUT', body: JSON.stringify({ assigned_to }) })
    if (r.success) { onReloadDetail(ticket); onRefresh() }
  }

  const handleRate = async () => {
    const r = await fetchApi(`/api/tickets/${ticket.id}/rate`, { method: 'POST', body: JSON.stringify({ rating: rateForm.rating, rating_comment: rateForm.comment }) })
    if (r.success) { toast('评价成功', 'success'); setRateOpen(false); onReloadDetail(ticket); onRefresh() }
    else toast(r.message || '评价失败', 'error')
  }

  const st = statusMap[ticket.status] || statusMap.open
  const StIcon = st.icon

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, marginBottom: 16, padding: 0 }}>
        <ChevronLeft size={16} /> 返回列表
      </button>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{ticket.title}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: st.color + '18', color: st.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><StIcon size={12} />{st.label}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: (typeMap[ticket.type]?.color || '#6b7280') + '18', color: typeMap[ticket.type]?.color || '#6b7280' }}>{typeMap[ticket.type]?.label || ticket.type}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: (priorityMap[ticket.priority]?.color || '#6b7280') + '18', color: priorityMap[ticket.priority]?.color || '#6b7280' }}>{priorityMap[ticket.priority]?.label || ticket.priority}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isStaff && ticket.status === 'open' && <button onClick={() => handleStatusChange('processing')} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>开始处理</button>}
            {isStaff && ticket.status === 'processing' && <button onClick={() => handleStatusChange('resolved')} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}>标记解决</button>}
            {(ticket.status === 'resolved') && !ticket.rating && ticket.created_by === user?.id && <button onClick={() => { setRateForm({ rating: 5, comment: '' }); setRateOpen(true) }} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} />评价</button>}
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>提交者：{ticket.creator_name || ticket.creator_username}</span>
          {ticket.assignee_name && <span>处理人：{ticket.assignee_name || ticket.assignee_username}</span>}
          {ticket.project_name && <span>项目：{ticket.project_name}</span>}
          <span>{new Date(ticket.created_at).toLocaleString('zh-CN')}</span>
        </div>
        {isStaff && !ticket.assigned_to && staffMembers.length > 0 && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>分配给：</span>
            <select onChange={e => handleAssign(Number(e.target.value))} defaultValue="" style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <option value="" disabled>选择处理人</option>
              {staffMembers.map((m: any) => <option key={m.id} value={m.id}>{m.nickname || m.username}</option>)}
            </select>
          </div>
        )}
        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{ticket.content || '(无描述)'}</div>
        {ticket.attachments?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {ticket.attachments.map((a: any) => (
              <a key={a.id} href={`${BACKEND_URL}/uploads/${a.filename}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 12, color: '#334155', textDecoration: 'none' }}>
                <Paperclip size={14} color="#64748b" /> {a.original_name} <span style={{ color: '#94a3b8' }}>({fmtSize(a.file_size)})</span> <Download size={12} color="#2563eb" />
              </a>
            ))}
          </div>
        )}

        {ticket.rating && (
          <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(i => <Star key={i} size={16} color="#d97706" fill={i <= ticket.rating ? '#d97706' : 'none'} />)}</div>
            {ticket.rating_comment && <span style={{ fontSize: 13, color: '#92400e' }}>{ticket.rating_comment}</span>}
          </div>
        )}

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>回复 ({ticket.replies?.length || 0})</div>
          {(ticket.replies || []).map((r: any) => (
            <div key={r.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <Avatar name={r.creator_name || r.creator_username} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.creator_name || r.creator_username}</span>
                  {isStaff && r.creator_role && ['admin', 'member'].includes(r.creator_role) && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>工作人员</span>}
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.content}</div>
                {r.attachments?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {r.attachments.map((a: any) => (
                      <a key={a.id} href={`${BACKEND_URL}/uploads/${a.filename}`} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 11, color: '#334155', textDecoration: 'none' }}>
                        <Paperclip size={12} color="#64748b" /> {a.original_name} <span style={{ color: '#94a3b8' }}>({fmtSize(a.file_size)})</span> <Download size={10} color="#2563eb" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={repliesEndRef} />
        </div>

        {ticket.status !== 'closed' && (
          <div style={{ marginTop: 12 }}>
            {replyFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {replyFiles.map((f, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af' }}>
                    <Paperclip size={12} /> {f.name} ({fmtSize(f.size)})
                    <button onClick={() => setReplyFiles(replyFiles.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} color="#94a3b8" /></button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="输入回复..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc' }} />
              <input ref={replyFileRef} type="file" multiple hidden onChange={e => { if (e.target.files) setReplyFiles([...replyFiles, ...Array.from(e.target.files)]); e.target.value = '' }} />
              <button onClick={() => replyFileRef.current?.click()} title="添加附件" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Paperclip size={16} color="#64748b" /></button>
              <button onClick={handleReply} disabled={sending || (!replyText.trim() && replyFiles.length === 0)}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, opacity: (!replyText.trim() && replyFiles.length === 0) ? 0.5 : 1 }}>
                <Send size={16} /> 回复
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={rateOpen} onClose={() => setRateOpen(false)} title="评价工单服务">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>满意度评分</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setRateForm({ ...rateForm, rating: i })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Star size={32} color="#d97706" fill={i <= rateForm.rating ? '#d97706' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>评价内容（选填）</div>
            <textarea value={rateForm.comment} onChange={e => setRateForm({ ...rateForm, comment: e.target.value })} placeholder="请输入您的评价..." rows={3}
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
