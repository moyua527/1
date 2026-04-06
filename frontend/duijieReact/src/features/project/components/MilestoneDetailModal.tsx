import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Plus, Trash2, Clock, Users, Bell, Send, CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { milestoneApi } from '../../milestone/services/api'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import useNicknameStore from '../../../stores/useNicknameStore'

interface Props {
  milestoneId: string
  currentUserId: number
  members: any[]
  remarkMap?: Record<string, string>
  onClose: () => void
  onRefresh: () => void
}

export default function MilestoneDetailModal({ milestoneId, currentUserId, members, onClose, onRefresh }: Props) {
  const globalDn = useNicknameStore(s => s.getDisplayName)
  const dn = (uid: number | undefined, fallback: string) => {
    if (!uid) return fallback
    return globalDn(uid, fallback)
  }
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'progress' | 'participants' | 'reminders'>('progress')
  const [progressInput, setProgressInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [reminderNote, setReminderNote] = useState('')
  const [showParticipantPicker, setShowParticipantPicker] = useState(false)
  const [showMention, setShowMention] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIdx, setMentionIdx] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mentionStartRef = useRef(-1)

  const load = useCallback(async () => {
    const r = await milestoneApi.detail(milestoneId)
    if (r.success) setData(r.data)
    else toast('加载失败', 'error')
    setLoading(false)
  }, [milestoneId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <Overlay onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="var(--brand)" />
      </div>
    </Overlay>
  )
  if (!data) return null

  const isCreator = data.created_by === currentUserId
  const isParticipant = (data.participants || []).some((p: any) => p.user_id === currentUserId)
  const canTrack = isCreator || isParticipant

  const mentionableUsers = (data?.participants || []).map((p: any) => ({
    id: p.user_id, name: dn(p.user_id, p.display_name || p.nickname || p.username || '')
  })).filter((u: any) => u.name)
  const filteredMentions = mentionableUsers.filter((u: any) =>
    u.name.toLowerCase().includes(mentionFilter.toLowerCase())
  )

  const insertMention = useCallback((user: { id: number; name: string }) => {
    const start = mentionStartRef.current
    if (start < 0) return
    const cursor = inputRef.current?.selectionStart || progressInput.length
    const before = progressInput.slice(0, start)
    const after = progressInput.slice(cursor)
    const newVal = `${before}@${user.name} ${after}`
    setProgressInput(newVal)
    setShowMention(false)
    setTimeout(() => {
      const pos = start + user.name.length + 2
      inputRef.current?.setSelectionRange(pos, pos)
      inputRef.current?.focus()
    }, 0)
  }, [progressInput])

  const handleAddProgress = async () => {
    if (!progressInput.trim()) return
    setSubmitting(true)
    const mentionedIds = mentionableUsers
      .filter((u: any) => progressInput.includes(`@${u.name}`))
      .map((u: any) => u.id)
    const r = await milestoneApi.addProgress(milestoneId, progressInput.trim(), mentionedIds.length > 0 ? mentionedIds : undefined)
    setSubmitting(false)
    if (r.success) {
      setProgressInput('')
      load()
    } else toast(r.message || '添加失败', 'error')
  }

  const handleDeleteProgress = async (pid: string) => {
    const r = await milestoneApi.deleteProgress(pid)
    if (r.success) load()
    else toast(r.message || '删除失败', 'error')
  }

  const handleToggleParticipant = async (userId: number) => {
    const current = (data.participants || []).map((p: any) => p.user_id)
    const next = current.includes(userId) ? current.filter((id: number) => id !== userId) : [...current, userId]
    const r = await milestoneApi.setParticipants(milestoneId, next)
    if (r.success) { load(); onRefresh() }
    else toast(r.message || '设置失败', 'error')
  }

  const handleAddReminder = async () => {
    if (!reminderDate || !reminderTime) { toast('请选择提醒日期和时间', 'error'); return }
    const remind_at = `${reminderDate} ${reminderTime}:00`
    const r = await milestoneApi.addReminder(milestoneId, remind_at, reminderNote)
    if (r.success) {
      setReminderDate('')
      setReminderTime('')
      setReminderNote('')
      toast('提醒已设置', 'success')
      load()
    } else toast(r.message || '设置失败', 'error')
  }

  const handleDeleteReminder = async (rid: string) => {
    const r = await milestoneApi.deleteReminder(rid)
    if (r.success) load()
    else toast(r.message || '删除失败', 'error')
  }

  const progress = data.progress || []
  const participants = data.participants || []
  const reminders = data.reminders || []

  const tabs = [
    { key: 'progress' as const, label: '跟踪进度', icon: Clock, count: progress.length },
    { key: 'participants' as const, label: '参与人', icon: Users, count: participants.length },
    { key: 'reminders' as const, label: '提醒通知', icon: Bell, count: reminders.length },
  ]

  return (
    <Overlay onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {data.is_completed
                  ? <CheckCircle2 size={20} color="#22c55e" />
                  : <Circle size={20} color="var(--brand)" />}
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-heading)' }}>{data.title}</h2>
              </div>
              {data.description && <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{data.description}</p>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                {data.due_date && <span>目标: {String(data.due_date).slice(0, 10)}</span>}
                <span>创建者: {data.creator_name || '未知'}</span>
                <span>创建于: {data.created_at ? new Date(data.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-tertiary)', borderRadius: 8 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveSection(t.key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: activeSection === t.key ? 600 : 400,
                color: activeSection === t.key ? 'var(--brand)' : 'var(--text-secondary)',
                borderBottom: activeSection === t.key ? '2px solid var(--brand)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              <t.icon size={14} />
              {t.label}
              {t.count > 0 && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: activeSection === t.key ? 'var(--brand)' : 'var(--bg-tertiary)', color: activeSection === t.key ? '#fff' : 'var(--text-tertiary)' }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 20px' }}>
          {activeSection === 'progress' && (
            <div>
              {/* Input */}
              {canTrack && (
                <div style={{ position: 'relative', display: 'flex', gap: 8, marginBottom: 20, alignItems: 'flex-end' }}>
                  <textarea ref={inputRef} value={progressInput}
                    onChange={e => {
                      const val = e.target.value
                      setProgressInput(val)
                      const cursor = e.target.selectionStart || 0
                      const before = val.slice(0, cursor)
                      const atIdx = before.lastIndexOf('@')
                      if (atIdx >= 0 && (atIdx === 0 || /\s/.test(before[atIdx - 1]))) {
                        const q = before.slice(atIdx + 1)
                        if (!q.includes(' ') && !q.includes('\n')) {
                          mentionStartRef.current = atIdx
                          setMentionFilter(q)
                          setShowMention(true)
                          setMentionIdx(0)
                          return
                        }
                      }
                      setShowMention(false)
                    }}
                    placeholder="填写跟踪进度… 输入 @ 可提及参与人"
                    onKeyDown={e => {
                      if (showMention && filteredMentions.length > 0) {
                        if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, filteredMentions.length - 1)); return }
                        if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return }
                        if (e.key === 'Tab' || (e.key === 'Enter' && !e.ctrlKey)) { e.preventDefault(); insertMention(filteredMentions[mentionIdx]); return }
                        if (e.key === 'Escape') { setShowMention(false); return }
                      }
                      if (e.key === 'Enter' && e.ctrlKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddProgress() }
                    }}
                    onBlur={() => setTimeout(() => setShowMention(false), 200)}
                    rows={2}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-heading)', resize: 'vertical', minHeight: 44, maxHeight: 120, fontFamily: 'inherit', lineHeight: 1.5 }} />
                  <Button onClick={handleAddProgress} disabled={submitting || !progressInput.trim()}>
                    {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                  </Button>
                  {showMention && filteredMentions.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, bottom: '100%', marginBottom: 4, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, maxHeight: 180, overflowY: 'auto', minWidth: 180, width: '60%' }}>
                      {filteredMentions.map((u: any, i: number) => (
                        <button key={u.id} onMouseDown={e => { e.preventDefault(); insertMention(u) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', border: 'none', background: i === mentionIdx ? 'var(--bg-tertiary)' : 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--text-heading)', textAlign: 'left' }}
                          onMouseEnter={() => setMentionIdx(i)}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{u.name[0]}</span>
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!canTrack && <div style={{ padding: '8px 12px', marginBottom: 16, borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 12, color: 'var(--text-tertiary)' }}>只有发起人和参与人可以添加跟踪</div>}

              {/* Timeline */}
              {progress.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无跟踪记录</div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: 'var(--border-primary)' }} />
                  {progress.map((p: any, i: number) => (
                    <div key={p.id} style={{ position: 'relative', paddingBottom: i < progress.length - 1 ? 20 : 0 }}>
                      <div style={{ position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--brand)', background: 'var(--bg-primary)', zIndex: 1 }} />
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, color: 'var(--text-heading)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {String(p.content || '').split(/(@\S+)/g).map((part: string, pi: number) =>
                                /^@\S+/.test(part) ? <span key={pi} style={{ color: 'var(--brand)', fontWeight: 500, cursor: 'default' }}>{part}</span> : part
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                              {dn(p.created_by, p.author_name || '未知')} · {p.created_at ? new Date(p.created_at).toLocaleString('zh-CN') : ''}
                            </div>
                          </div>
                          {p.created_by === currentUserId && (
                            <button onClick={() => handleDeleteProgress(String(p.id))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', flexShrink: 0, borderRadius: 6 }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'participants' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>只有发起人和参与人可以跟进进度、设置提醒</div>
              {/* Current participants */}
              {participants.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {participants.map((p: any) => (
                    <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {(dn(p.user_id, p.display_name) || '?')[0]}
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-heading)' }}>{dn(p.user_id, p.display_name)}</span>
                      {isCreator && (
                        <button onClick={() => handleToggleParticipant(p.user_id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary)', display: 'flex', borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add participants (only creator) */}
              {isCreator && (
                <div>
                  <Button variant="secondary" onClick={() => setShowParticipantPicker(v => !v)}>
                    <Plus size={14} /> 添加参与人
                    {showParticipantPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  {showParticipantPicker && (
                    <div style={{ marginTop: 8, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-primary)', maxHeight: 240, overflow: 'auto' }}>
                      {members.filter(m => m.user_id !== currentUserId).map((m: any) => {
                        const isIn = participants.some((p: any) => p.user_id === m.user_id)
                        const name = dn(m.user_id, m.project_nickname || m.nickname || m.username || '?')
                        return (
                          <div key={m.user_id} onClick={() => handleToggleParticipant(m.user_id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: isIn ? 'var(--brand)' : 'var(--bg-tertiary)', color: isIn ? '#fff' : 'var(--text-tertiary)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, transition: 'all 0.15s' }}>
                              {isIn ? <CheckCircle2 size={16} /> : name[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{name}</div>
                            </div>
                            {isIn && <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 500 }}>已添加</span>}
                          </div>
                        )
                      })}
                      {members.filter(m => m.user_id !== currentUserId).length === 0 && (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>暂无可添加的成员</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!isCreator && participants.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无参与人</div>
              )}
            </div>
          )}

          {activeSection === 'reminders' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>设置定时提醒，到期后会推送通知提醒您跟进</div>

              {canTrack && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, border: '1px solid var(--border-primary)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 130 }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>日期</label>
                      <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-heading)', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>时间</label>
                      <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-heading)', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <input value={reminderNote} onChange={e => setReminderNote(e.target.value)}
                    placeholder="备注（可选），例如：检查审核进度"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-heading)', marginBottom: 10, boxSizing: 'border-box' }} />
                  <Button onClick={handleAddReminder} disabled={!reminderDate || !reminderTime}>
                    <Bell size={14} /> 设置提醒
                  </Button>
                </div>
              )}

              {reminders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无提醒</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reminders.map((r: any) => {
                    const isPast = new Date(r.remind_at) < new Date()
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: r.is_sent ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', border: '1px solid var(--border-primary)', opacity: r.is_sent ? 0.6 : 1 }}>
                        <Bell size={16} color={r.is_sent ? 'var(--text-tertiary)' : isPast ? 'var(--color-danger)' : 'var(--brand)'} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-heading)' }}>
                            {r.remind_at_display || (r.remind_at ? new Date(r.remind_at).toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '')}
                            {!!r.is_sent && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>已发送</span>}
                            {!r.is_sent && isPast && <span style={{ fontSize: 11, color: 'var(--color-danger)', marginLeft: 6 }}>待发送</span>}
                          </div>
                          {r.note && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{r.note}</div>}
                        </div>
                        {!r.is_sent && (
                          <button onClick={() => handleDeleteReminder(String(r.id))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{
        position: 'relative', background: 'var(--bg-primary)', borderRadius: 16,
        width: '94%', maxWidth: 600, maxHeight: '85vh', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  )
}
