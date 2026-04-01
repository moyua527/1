import { useState } from 'react'
import { MessageSquare, Plus, PhoneCall, MapPin, AtSign, HelpCircle, Send } from 'lucide-react'
import { clientApi } from '../services/api'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { sectionStyle, followTypeMap } from './constants'

interface Props { clientId: string; followUps: any[]; onRefresh: () => void; embedded?: boolean }

const getFollowIcon = (type: string) => {
  switch (type) {
    case 'phone': return <PhoneCall size={14} />
    case 'wechat': return <MessageSquare size={14} />
    case 'visit': return <MapPin size={14} />
    case 'email': return <AtSign size={14} />
    default: return <HelpCircle size={14} />
  }
}

export default function FollowUpSection({ clientId, followUps, onRefresh, embedded }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ content: '', follow_type: 'phone', next_follow_date: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!form.content.trim()) { toast('请输入跟进内容', 'error'); return }
    setSubmitting(true)
    const r = await clientApi.createFollowUp({ client_id: Number(clientId), ...form })
    setSubmitting(false)
    if (r.success) { toast('跟进记录已添加', 'success'); setShowForm(false); setForm({ content: '', follow_type: 'phone', next_follow_date: '' }); onRefresh() }
    else toast(r.message || '添加失败', 'error')
  }

  const startEdit = (f: any) => {
    setEditing(f)
    setForm({ content: f.content || '', follow_type: f.follow_type || 'phone', next_follow_date: f.next_follow_date ? f.next_follow_date.slice(0, 10) : '' })
    setShowForm(true)
  }

  const handleUpdate = async () => {
    if (!form.content.trim()) { toast('请输入跟进内容', 'error'); return }
    setSubmitting(true)
    const r = await clientApi.updateFollowUp(editing.id, form)
    setSubmitting(false)
    if (r.success) { toast('跟进记录已更新', 'success'); setShowForm(false); setEditing(null); setForm({ content: '', follow_type: 'phone', next_follow_date: '' }); onRefresh() }
    else toast(r.message || '更新失败', 'error')
  }

  const handleDelete = async (fId: number) => {
    const r = await clientApi.deleteFollowUp(fId)
    if (r.success) { toast('跟进记录已删除', 'success'); onRefresh() }
    else toast(r.message || '删除失败', 'error')
  }

  return (
    <div style={embedded ? {} : { ...sectionStyle, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={18} color="var(--brand)" />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-body)' }}>跟进记录</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({followUps.length})</span>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ content: '', follow_type: 'phone', next_follow_date: '' }); setShowForm(!showForm) }}><Plus size={14} /> 新增跟进</Button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>跟进方式</label>
              <select value={form.follow_type} onChange={e => setForm({ ...form, follow_type: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}>
                {Object.entries(followTypeMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>下次跟进日期</label>
              <input type="date" value={form.next_follow_date} onChange={e => setForm({ ...form, next_follow_date: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }} />
            </div>
          </div>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="输入跟进内容..." rows={3}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>取消</Button>
            <Button onClick={editing ? handleUpdate : handleCreate} disabled={submitting}><Send size={14} /> {submitting ? '提交中...' : editing ? '保存修改' : '提交'}</Button>
          </div>
        </div>
      )}

      {followUps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无跟进记录，点击"新增跟进"开始</div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: 'var(--border-primary)' }} />
          {followUps.map((f: any) => (
            <div key={f.id} style={{ position: 'relative', paddingBottom: 20 }}>
              <div style={{ position: 'absolute', left: -20, top: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)' }}>
                {getFollowIcon(f.follow_type)}
              </div>
              <div style={{ marginLeft: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(f.created_at).toLocaleString('zh-CN')}</span>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-selected)', color: 'var(--brand)' }}>{followTypeMap[f.follow_type]?.label || f.follow_type}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.created_by_name || '用户'}</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>{f.content}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  {f.next_follow_date && <span style={{ fontSize: 12, color: '#f59e0b' }}>⏰ 下次跟进: {new Date(f.next_follow_date).toLocaleDateString('zh-CN')}</span>}
                  <span style={{ marginLeft: 'auto' }} />
                  <button onClick={() => startEdit(f)} style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>编辑</button>
                  <button onClick={() => handleDelete(f.id)} style={{ fontSize: 11, color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
