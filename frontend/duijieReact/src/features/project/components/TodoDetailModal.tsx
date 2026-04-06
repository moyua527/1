import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import { Send, Plus, Trash2, Clock, Users, MessageSquare, Bell, AtSign, Pencil, Check, RotateCcw } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import useNicknameStore from '../../../stores/useNicknameStore'

interface Props {
  open: boolean
  milestoneId: number | null
  projectId: string
  canEdit: boolean
  currentUserId: number
  members: any[]
  onClose: () => void
  onRefresh: () => void
}

export default function TodoDetailModal({ open, milestoneId, projectId, canEdit, currentUserId, members, onClose, onRefresh }: Props) {
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
  const [, setMentionFilter] = useState('')
  const [mentionList, setMentionList] = useState<number[]>([])
  const [editingMs, setEditingMs] = useState(false)
  const [editMsTitle, setEditMsTitle] = useState('')
  const [editMsDesc, setEditMsDesc] = useState('')
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressVal, setProgressVal] = useState(0)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dn = useNicknameStore(s => s.getDisplayName)

  const load = useCallback(() => {
    if (!milestoneId) return
    fetchApi(`/api/milestones/${milestoneId}/detail`).then(r => { if (r.success) setDetail(r.data) })
  }, [milestoneId])

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

  useEffect(() => {
    if (!open || !milestoneId) return
    setTab('messages')
    load()
    loadMessages()
    loadReminders()
    loadParticipants()
  }, [open, milestoneId])

  useEffect(() => {
    if (msgEndRef.current) msgEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isParticipantOrCreator = participants.some(p => p.user_id === currentUserId) || detail?.created_by === currentUserId

  const handleSendMsg = async () => {
    if (!msgInput.trim() || !milestoneId) return
    setSending(true)
    const r = await fetchApi(`/api/milestones/${milestoneId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: msgInput.trim(), mentioned_users: mentionList }),
    })
    setSending(false)
    if (r.success) {
      setMsgInput('')
      setMentionList([])
      await loadMessages()
      load()
    } else toast(r.message || '发送失败', 'error')
  }

  const handleMsgKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMsg()
    }
    if (e.key === '@' || (e.key === '2' && e.shiftKey)) {
      setMentioning(true)
      setMentionFilter('')
    }
  }

  const insertMention = (uid: number, name: string) => {
    setMsgInput(prev => prev + `@${name} `)
    if (!mentionList.includes(uid)) setMentionList(prev => [...prev, uid])
    setMentioning(false)
    inputRef.current?.focus()
  }

  const handleAddParticipant = async (userId: number) => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    })
    if (r.success) { toast('已添加', 'success'); await loadParticipants(); load() }
    else toast(r.message || '添加失败', 'error')
  }

  const handleRemoveParticipant = async (userId: number) => {
    if (!milestoneId) return
    if (!(await confirm({ message: '确定移除该参与人？', danger: true }))) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/participants/${userId}`, { method: 'DELETE' })
    if (r.success) { toast('已移除', 'success'); await loadParticipants(); load() }
    else toast(r.message || '移除失败', 'error')
  }

  const handleAddReminder = async () => {
    if (!reminderTime || !milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/reminders`, {
      method: 'POST',
      body: JSON.stringify({ remind_at: reminderTime, message: reminderMsg.trim() || undefined }),
    })
    if (r.success) {
      setShowAddReminder(false)
      setReminderTime('')
      setReminderMsg('')
      loadReminders()
      load()
      toast('提醒已创建', 'success')
    } else toast(r.message || '创建失败', 'error')
  }

  const handleDeleteReminder = async (id: number) => {
    if (!(await confirm({ message: '确定删除该提醒？', danger: true }))) return
    const r = await fetchApi(`/api/milestone-reminders/${id}`, { method: 'DELETE' })
    if (r.success) { loadReminders(); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleToggle = async () => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/toggle`, { method: 'PATCH' })
    if (r.success) { load(); onRefresh() }
    else toast(r.message || '操作失败', 'error')
  }

  const handleDeleteMilestone = async () => {
    if (!milestoneId || !detail) return
    if (!(await confirm({ message: `确定删除「${detail.title}」？`, danger: true }))) return
    const r = await fetchApi(`/api/milestones/${milestoneId}`, { method: 'DELETE' })
    if (r.success) { toast('已删除', 'success'); onClose(); onRefresh() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleEditMilestone = async () => {
    if (!milestoneId || !editMsTitle.trim()) return
    const r = await fetchApi(`/api/milestones/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: editMsTitle.trim(), description: editMsDesc.trim() || null }),
    })
    if (r.success) { setEditingMs(false); load(); onRefresh() }
    else toast(r.message || '更新失败', 'error')
  }

  const handleUpdateProgress = async (val: number) => {
    if (!milestoneId) return
    const r = await fetchApi(`/api/milestones/${milestoneId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress: val }),
    })
    if (r.success) { setEditingProgress(false); load(); onRefresh() }
    else toast(r.message || '更新失败', 'error')
  }

  const participantIds = new Set(participants.map(p => p.user_id))
  const availableMembers = members.filter(m => !participantIds.has(m.user_id || m.id) && (m.user_id || m.id) !== detail?.created_by)
  const mentionableUsers = participants.filter(p => p.user_id !== currentUserId)

  const formatDt = (d: string) => {
    try { return new Date(d).toLocaleString('zh-CN') } catch { return d }
  }

  if (!open || !milestoneId) return null

  const tabs = [
    { key: 'messages' as const, label: '跟踪进度', icon: <MessageSquare size={13} />, count: detail?.message_count },
    { key: 'reminders' as const, label: '提醒', icon: <Bell size={13} />, count: detail?.reminder_count },
    { key: 'participants' as const, label: '参与人', icon: <Users size={13} />, count: detail?.participant_count },
  ]

  return (
    <Modal open={open} onClose={onClose} title={detail?.title || '代办详情'} minHeight={560}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 440 }}>
        {/* 基本信息 */}
        {detail && !editingMs && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                background: detail.is_completed ? '#d1fae5' : '#dbeafe',
                color: detail.is_completed ? '#065f46' : '#1e40af',
              }}>
                {detail.is_completed ? '已完成' : '进行中'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>创建于 {formatDt(detail.created_at)}</span>
              {canEdit && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button onClick={handleToggle} title={detail.is_completed ? '标记未完成' : '标记已完成'}
                    style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {detail.is_completed ? <><RotateCcw size={11} /> 未完成</> : <><Check size={11} /> 完成</>}
                  </button>
                  <button onClick={() => { setEditMsTitle(detail.title); setEditMsDesc(detail.description || ''); setEditingMs(true) }}
                    style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Pencil size={11} /> 编辑
                  </button>
                  <button onClick={handleDeleteMilestone}
                    style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Trash2 size={11} /> 删除
                  </button>
                </div>
              )}
            </div>
            {detail.description && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{detail.description}</div>
            )}
            {/* 进度条 */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>进度</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: (detail.progress ?? 0) >= 100 ? '#059669' : 'var(--brand)' }}>{detail.progress ?? 0}%</span>
                {canEdit && !detail.is_completed && !editingProgress && (
                  <button onClick={() => { setProgressVal(detail.progress ?? 0); setEditingProgress(true) }}
                    style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '1px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)' }}>
                    调整
                  </button>
                )}
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, transition: 'width 0.3s ease',
                  width: `${Math.min(detail.progress ?? 0, 100)}%`,
                  background: (detail.progress ?? 0) >= 100 ? '#059669' : (detail.progress ?? 0) >= 60 ? '#3b82f6' : (detail.progress ?? 0) >= 30 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
              {editingProgress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <input type="range" min={0} max={99} value={progressVal} onChange={e => setProgressVal(+e.target.value)}
                    style={{ flex: 1, accentColor: 'var(--brand)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', minWidth: 32 }}>{progressVal}%</span>
                  <button onClick={() => handleUpdateProgress(progressVal)}
                    style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                    确定
                  </button>
                  <button onClick={() => setEditingProgress(false)}
                    style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border-primary)', background: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    取消
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {detail && editingMs && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-primary)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={editMsTitle} onChange={e => setEditMsTitle(e.target.value)} autoFocus placeholder="标题"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)' }} />
            <textarea value={editMsDesc} onChange={e => setEditMsDesc(e.target.value)} rows={2} placeholder="描述（可选）"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)', resize: 'none' }} />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setEditingMs(false)}>取消</Button>
              <Button onClick={handleEditMilestone} disabled={!editMsTitle.trim()}>保存</Button>
            </div>
          </div>
        )}

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: 'none',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: tab === t.key ? 'var(--brand)' : 'var(--bg-tertiary)',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
            }}>
              {t.icon} {t.label}
              {(t.count ?? 0) > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {/* 跟踪进度 */}
        {tab === 'messages' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无跟踪记录，发送第一条进度吧</div>
              )}
              {messages.map(m => {
                const mentions: number[] = typeof m.mentioned_users === 'string' ? JSON.parse(m.mentioned_users || '[]') : (m.mentioned_users || [])
                const isMentioned = mentions.includes(currentUserId)
                return (
                  <div key={m.id} style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 13,
                    background: isMentioned ? '#fef3c7' : 'var(--bg-secondary)',
                    border: isMentioned ? '1px solid #f59e0b' : '1px solid var(--border-primary)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: 12 }}>
                        {dn(m.user_id, m.nickname || m.username)}
                        {isMentioned && <span style={{ color: '#f59e0b', marginLeft: 6, fontSize: 11 }}>@了你</span>}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDt(m.created_at)}</span>
                    </div>
                    <div style={{ color: 'var(--text-body)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.content}</div>
                  </div>
                )
              })}
              <div ref={msgEndRef} />
            </div>
            {/* 输入框 */}
            {isParticipantOrCreator && (
              <div style={{ flexShrink: 0, position: 'relative' }}>
                {mentioning && mentionableUsers.length > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
                    background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 150, overflowY: 'auto', zIndex: 10,
                  }}>
                    {mentionableUsers.map(u => (
                      <button key={u.user_id} onClick={() => insertMention(u.user_id, u.nickname || u.username)}
                        style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-body)', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <AtSign size={12} style={{ marginRight: 4 }} />{dn(u.user_id, u.nickname || u.username)}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    ref={inputRef}
                    value={msgInput}
                    onChange={e => { setMsgInput(e.target.value); if (mentioning) setMentioning(false) }}
                    onKeyDown={handleMsgKeyDown}
                    placeholder="输入进度... Shift+Enter换行，@提及参与人"
                    rows={2}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)',
                      fontSize: 13, outline: 'none', resize: 'none', background: 'var(--bg-secondary)', color: 'var(--text-body)',
                    }}
                  />
                  <button onClick={handleSendMsg} disabled={sending || !msgInput.trim()}
                    style={{
                      padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500,
                      opacity: sending || !msgInput.trim() ? 0.5 : 1, flexShrink: 0,
                    }}>
                    <Send size={14} /> 发送
                  </button>
                </div>
              </div>
            )}
            {!isParticipantOrCreator && (
              <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-tertiary)', fontSize: 12 }}>
                仅发起人和参与人可发送进度
              </div>
            )}
          </div>
        )}

        {/* 提醒 */}
        {tab === 'reminders' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, flexShrink: 0 }}>
              <button onClick={() => setShowAddReminder(true)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none',
                background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer',
              }}>
                <Plus size={12} /> 新建提醒
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reminders.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无提醒</div>
              )}
              {reminders.map(r => (
                <div key={r.id} style={{
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Clock size={16} color={r.is_sent ? '#10b981' : '#f59e0b'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>
                      {formatDt(r.remind_at)}
                      {r.is_sent && <span style={{ marginLeft: 8, fontSize: 11, color: '#10b981' }}>已提醒</span>}
                      {!r.is_sent && <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b' }}>等待中</span>}
                    </div>
                    {r.message && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{r.message}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      创建于 {formatDt(r.created_at)} · {dn(r.user_id, r.nickname || r.username)}
                    </div>
                  </div>
                  {!r.is_sent && (
                    <button onClick={() => handleDeleteReminder(r.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* 新建提醒弹窗 */}
            {showAddReminder && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
                onClick={e => { if (e.target === e.currentTarget) setShowAddReminder(false) }}>
                <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, width: 380, maxWidth: '90vw', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>新建提醒</h4>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>提醒时间 *</label>
                    <input type="datetime-local" step="1" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>提醒内容</label>
                    <input value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="可选备注"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-heading)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => setShowAddReminder(false)}>取消</Button>
                    <Button onClick={handleAddReminder} disabled={!reminderTime}>创建</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 参与人 */}
        {tab === 'participants' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {canEdit && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, flexShrink: 0 }}>
                <button onClick={() => setShowAddParticipant(!showAddParticipant)} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none',
                  background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer',
                }}>
                  <Plus size={12} /> 添加参与人
                </button>
              </div>
            )}
            {showAddParticipant && (
              <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: '1px dashed var(--border-primary)', background: 'var(--bg-secondary)', maxHeight: 150, overflowY: 'auto' }}>
                {availableMembers.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>所有成员已添加</div>
                ) : availableMembers.map(m => {
                  const uid = m.user_id || m.id
                  return (
                    <button key={uid} onClick={() => handleAddParticipant(uid)}
                      style={{ display: 'block', width: '100%', padding: '6px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-body)', textAlign: 'left', borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      + {dn(uid, m.project_nickname || m.nickname || m.username)}
                    </button>
                  )
                })}
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* 发起人 */}
              {detail && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {(detail.creator_nickname || detail.creator_username || '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{detail.creator_nickname || detail.creator_username || '发起人'}</span>
                    <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 6 }}>发起人</span>
                  </div>
                </div>
              )}
              {participants.map(p => (
                <div key={p.user_id} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {(dn(p.user_id, p.nickname || p.username || '?'))[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{dn(p.user_id, p.nickname || p.username)}</span>
                  </div>
                  {canEdit && (
                    <button onClick={() => handleRemoveParticipant(p.user_id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              {participants.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无参与人</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
