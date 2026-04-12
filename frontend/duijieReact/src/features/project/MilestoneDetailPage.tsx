import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Send, Plus, Trash2, Clock, Users, MessageSquare, Bell, AtSign, Pencil, Check, RotateCcw, ChevronLeft } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import Button from '../ui/Button'
import useNicknameStore from '../../stores/useNicknameStore'

export default function MilestoneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateData = (location.state as any) || {}
  const canEdit = stateData.canEdit !== false
  const currentUserId = stateData.currentUserId || 0
  const members = stateData.members || []

  const [detail, setDetail] = useState<any>(null)
  const [tab, setTab] = useState<'messages' | 'reminders' | 'participants'>('messages')
  const [messages, setMessages] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [reminderTime, setReminderTime] = useState('')
  const [reminderMsg, setReminderMsg] = useState('')
  const [mentioning, setMentioning] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionList, setMentionList] = useState<number[]>([])
  const [editingMs, setEditingMs] = useState(false)
  const [editMsTitle, setEditMsTitle] = useState('')
  const [editMsDesc, setEditMsDesc] = useState('')
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressVal, setProgressVal] = useState(0)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dn = useNicknameStore(s => s.getDisplayName)

  const milestoneId = id ? Number(id) : null

  const load = useCallback(() => {
    if (!milestoneId) return
    fetchApi(`/api/milestones/${milestoneId}/detail`).then(r => {
      if (r.success) setDetail(r.data)
      else { toast('代办不存在', 'error'); navigate(-1) }
    })
  }, [milestoneId, navigate])

  const loadMessages = useCallback(async () => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/messages`)
    if (r.success) setMessages(r.data || [])
  }, [milestoneId])

  const loadReminders = useCallback(async () => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/reminders`)
    if (r.success) setReminders(r.data || [])
  }, [milestoneId])

  const loadParticipants = useCallback(async () => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/participants`)
    if (r.success) setParticipants(r.data || [])
  }, [milestoneId])

  useEffect(() => { load(); loadMessages(); loadReminders(); loadParticipants() }, [load, loadMessages, loadReminders, loadParticipants])

  const sendMessage = async () => {
    if (!msgInput.trim() || !milestoneId) return
    setSending(true)
    const r = await fetchApi(`/api/milestones/${milestoneId}/messages`, { method: 'POST', body: JSON.stringify({ content: msgInput.trim(), mentioned_user_ids: mentionList }) })
    setSending(false)
    if (r.success) { setMsgInput(''); setMentionList([]); loadMessages() }
    else toast(r.message || '发送失败', 'error')
  }

  const handleMsgKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    if (e.key === '@') setMentioning(true)
  }

  const addMention = (uid: number, name: string) => {
    setMsgInput(prev => prev + `@${name} `)
    setMentionList(prev => [...new Set([...prev, uid])])
    setMentioning(false)
    setMentionFilter('')
    inputRef.current?.focus()
  }

  const handleToggle = async () => {
    if (!milestoneId || !detail) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/toggle`, { method: 'PATCH' })
    if (r.success) { load(); toast(detail.is_completed ? '已恢复' : '已完成', 'success') }
  }

  const handleSaveEdit = async () => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify({ title: editMsTitle, description: editMsDesc }) })
    if (r.success) { setEditingMs(false); load(); toast('已更新', 'success') }
    else toast(r.message || '更新失败', 'error')
  }

  const handleSaveProgress = async () => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress: progressVal }) })
    if (r.success) { setEditingProgress(false); load(); toast('进度已更新', 'success') }
  }

  const addParticipant = async (uid: number) => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/participants`, { method: 'POST', body: JSON.stringify({ user_id: uid }) })
    if (r.success) { loadParticipants(); setShowAddParticipant(false) }
    else toast(r.message || '添加失败', 'error')
  }

  const removeParticipant = async (uid: number) => {
    if (!milestoneId || !await confirm({ message: '确定移除该参与人？' })) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/participants/${uid}`, { method: 'DELETE' })
    if (r.success) loadParticipants()
  }

  const addReminder = async () => {
    if (!milestoneId || !reminderTime) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/reminders`, { method: 'POST', body: JSON.stringify({ remind_at: reminderTime, message: reminderMsg }) })
    if (r.success) { setShowAddReminder(false); setReminderTime(''); setReminderMsg(''); loadReminders() }
    else toast(r.message || '添加失败', 'error')
  }

  const removeReminder = async (rid: number) => {
    if (!await confirm({ message: '确定删除该提醒？' })) return
    const r = await fetchApi(`/api/milestone-reminders/${rid}`, { method: 'DELETE' })
    if (r.success) loadReminders()
  }

  if (!detail) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>

  const isParticipant = participants.some(p => p.user_id === currentUserId) || detail.created_by === currentUserId
  const canInteract = canEdit || isParticipant

  const tabBtn = (t: typeof tab, icon: any, label: string, count?: number) => (
    <button onClick={() => setTab(t)} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0',
      border: 'none', borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
      background: 'none', color: tab === t ? 'var(--brand)' : 'var(--text-secondary)', fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
    }}>
      {icon} {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-heading)' }}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>代办详情</span>
        {canInteract && (
          <button onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: detail.is_completed ? '#f0fdf4' : 'var(--bg-selected)', color: detail.is_completed ? 'var(--color-success)' : 'var(--brand)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {detail.is_completed ? <><RotateCcw size={14} /> 恢复</> : <><Check size={14} /> 完成</>}
          </button>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 16 }}>
          {editingMs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={editMsTitle} onChange={e => setEditMsTitle(e.target.value)} placeholder="标题" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 15, fontWeight: 600 }} />
              <textarea value={editMsDesc} onChange={e => setEditMsDesc(e.target.value)} placeholder="描述" rows={3} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 14, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="ghost" onClick={() => setEditingMs(false)}>取消</Button>
                <Button size="sm" onClick={handleSaveEdit}>保存</Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: detail.is_completed ? 'var(--text-tertiary)' : 'var(--text-heading)', textDecoration: detail.is_completed ? 'line-through' : 'none' }}>
                  {detail.title}
                </div>
                {canEdit && <button onClick={() => { setEditingMs(true); setEditMsTitle(detail.title); setEditMsDesc(detail.description || '') }} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Pencil size={16} /></button>}
              </div>
              {detail.description && <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{detail.description}</div>}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>进度 {detail.progress || 0}%</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${detail.progress || 0}%`, height: '100%', background: 'var(--brand)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                {canEdit && !editingProgress && <button onClick={() => { setEditingProgress(true); setProgressVal(detail.progress || 0) }} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-primary)', background: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>调整</button>}
              </div>
              {editingProgress && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min={0} max={100} step={5} value={progressVal} onChange={e => setProgressVal(Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 13, minWidth: 36 }}>{progressVal}%</span>
                  <Button size="sm" onClick={handleSaveProgress}>保存</Button>
                </div>
              )}
            </>
          )}
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
            创建人: {dn(detail.created_by, detail.creator_name || detail.created_by)} · {detail.created_at ? new Date(detail.created_at).toLocaleString('zh-CN') : ''}
          </div>
        </div>

        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)' }}>
            {tabBtn('messages', <MessageSquare size={14} />, '跟踪', messages.length)}
            {tabBtn('reminders', <Bell size={14} />, '提醒', reminders.length)}
            {tabBtn('participants', <Users size={14} />, '参与人', participants.length)}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {tab === 'messages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无跟踪消息</div>}
                {messages.map(m => (
                  <div key={m.id} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>{dn(m.user_id, m.author_name || m.user_id)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.created_at ? new Date(m.created_at).toLocaleString('zh-CN') : ''}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  </div>
                ))}
                <div ref={msgEndRef} />
              </div>
            )}

            {tab === 'reminders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reminders.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <Clock size={14} color="var(--text-secondary)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-heading)' }}>{r.remind_at ? new Date(r.remind_at).toLocaleString('zh-CN') : ''}</div>
                      {r.message && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.message}</div>}
                    </div>
                    {canEdit && <button onClick={() => removeReminder(r.id)} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Trash2 size={14} /></button>}
                  </div>
                ))}
                {showAddReminder ? (
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="datetime-local" value={reminderTime} onChange={e => setReminderTime(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13 }} />
                    <input value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="备注(可选)" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddReminder(false)}>取消</Button>
                      <Button size="sm" onClick={addReminder}>添加</Button>
                    </div>
                  </div>
                ) : canEdit && (
                  <button onClick={() => setShowAddReminder(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, borderRadius: 8, border: '1px dashed var(--border-primary)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                    <Plus size={14} /> 添加提醒
                  </button>
                )}
              </div>
            )}

            {tab === 'participants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {participants.map(p => (
                  <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <Users size={14} color="var(--text-secondary)" />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-heading)' }}>{dn(p.user_id, p.nickname || p.user_id)}</span>
                    {canEdit && p.user_id !== detail.created_by && <button onClick={() => removeParticipant(p.user_id)} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Trash2 size={14} /></button>}
                  </div>
                ))}
                {showAddParticipant ? (
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {members.filter((m: any) => !participants.some(p => p.user_id === m.user_id)).map((m: any) => (
                      <button key={m.user_id} onClick={() => addParticipant(m.user_id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-heading)' }}>{dn(m.user_id, m.nickname || m.user_id)}</span>
                      </button>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => setShowAddParticipant(false)}>关闭</Button>
                  </div>
                ) : canEdit && (
                  <button onClick={() => setShowAddParticipant(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, borderRadius: 8, border: '1px dashed var(--border-primary)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                    <Plus size={14} /> 添加参与人
                  </button>
                )}
              </div>
            )}
          </div>

          {tab === 'messages' && canInteract && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
              {mentioning && (
                <div style={{ marginBottom: 8, maxHeight: 120, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 8, padding: 4 }}>
                  {members.filter((m: any) => !mentionFilter || (m.nickname || '').includes(mentionFilter)).map((m: any) => (
                    <button key={m.user_id} onClick={() => addMention(m.user_id, m.nickname || m.user_id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-heading)', borderRadius: 4 }}>
                      <AtSign size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {dn(m.user_id, m.nickname || m.user_id)}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea ref={inputRef} value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={handleMsgKey}
                  placeholder="输入跟踪进度..." rows={1}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, resize: 'none', outline: 'none' }} />
                <button onClick={sendMessage} disabled={sending || !msgInput.trim()} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
