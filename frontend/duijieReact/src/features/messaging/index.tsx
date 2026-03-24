import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Send, MessageSquare, Search, User, Check, CheckCheck, Loader2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { onSocket } from '../ui/smartSocket'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'

const roleLabel: Record<string, string> = { admin: '管理', tech: '技术', business: '业务', member: '成员' }

const dmApi = {
  conversations: () => fetchApi('/api/dm/conversations'),
  users: () => fetchApi('/api/dm/users'),
  history: (userId: number) => fetchApi(`/api/dm/${userId}/history`),
  send: (receiver_id: number, content: string) => fetchApi('/api/dm/send', { method: 'POST', body: JSON.stringify({ receiver_id, content }) }),
  recall: (id: number) => fetchApi(`/api/dm/${id}/recall`, { method: 'PATCH' }),
}

export default function Messaging() {
  const [conversations, setConversations] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchUser, setSearchUser] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<any>(null)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()
  const [me, setMe] = useState<any>(null)

  useEffect(() => {
    fetchApi('/api/auth/me').then(r => { if (r.success) setMe(r.data) })
  }, [])

  const loadConversations = () => {
    dmApi.conversations().then(r => { if (r.success) setConversations(r.data || []) }).finally(() => setLoading(false))
  }

  const pullMessages = () => {
    const sel = selectedRef.current
    if (sel) {
      dmApi.history(sel.id).then(r => {
        if (r.success) setMessages(r.data || [])
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        loadConversations()
        window.dispatchEvent(new Event('dm-read'))
      })
    } else {
      loadConversations()
      window.dispatchEvent(new Event('dm-read'))
    }
  }

  useEffect(() => {
    loadConversations()
    const offDm = onSocket('new_dm', pullMessages)
    const offReconnect = onSocket('reconnect', () => { loadConversations(); pullMessages() })
    const t = setInterval(loadConversations, 60000)
    return () => { clearInterval(t); offDm(); offReconnect() }
  }, [])

  const selectUser = (user: any) => {
    setSelectedUser(user)
    selectedRef.current = user
    setShowNewChat(false)
    dmApi.history(user.id).then(r => {
      if (r.success) setMessages(r.data || [])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      loadConversations()
      window.dispatchEvent(new Event('dm-read'))
    })
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return
    setSending(true)
    const r = await dmApi.send(selectedUser.id, input.trim())
    setSending(false)
    if (r.success) {
      setInput('')
      dmApi.history(selectedUser.id).then(r => {
        if (r.success) setMessages(r.data || [])
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      loadConversations()
    } else toast(r.message || '发送失败', 'error')
  }

  const openNewChat = () => {
    dmApi.users().then(r => { if (r.success) setAllUsers(r.data || []) })
    setShowNewChat(true)
    setSearchUser('')
  }

  const filteredUsers = allUsers.filter(u => {
    if (!searchUser.trim()) return true
    const q = searchUser.trim().toLowerCase()
    return [u.nickname, u.username].some(v => v && v.toLowerCase().includes(q))
  })

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Left: conversation list */}
      <div style={{ width: isMobile ? (selectedUser ? 0 : '100%') : 320, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', transition: 'width 0.2s' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={20} color="#2563eb" />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>消息</span>
              {totalUnread > 0 && <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: '#dc2626', color: '#fff', fontWeight: 600 }}>{totalUnread}</span>}
            </div>
            <button onClick={openNewChat} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>新消息</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {showNewChat && (
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="搜索用户..."
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }} autoFocus />
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {filteredUsers.map(u => (
                  <div key={u.id} onClick={() => selectUser(u)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Avatar name={u.nickname || u.username} size={32} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{u.nickname || u.username}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{roleLabel[u.role] || u.role}</div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 12 }}>无匹配用户</div>}
              </div>
            </div>
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : conversations.length === 0 && !showNewChat ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>暂无消息记录<br />点击"新消息"开始聊天</div>
          ) : (
            conversations.map(c => (
              <div key={c.id} onClick={() => selectUser(c)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                  background: selectedUser?.id === c.id ? '#eff6ff' : '#fff' }}
                onMouseEnter={e => { if (selectedUser?.id !== c.id) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (selectedUser?.id !== c.id) e.currentTarget.style.background = '#fff' }}>
                <Avatar name={c.nickname || c.username} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: c.unread_count > 0 ? 700 : 500, color: '#0f172a' }}>{c.nickname || c.username}</span>
                    {c.last_time && <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(c.last_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{c.last_message}</span>
                    {c.unread_count > 0 && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: '#dc2626', color: '#fff', fontWeight: 600, flexShrink: 0 }}>{c.unread_count}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile && <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4 }}>←</button>}
              <Avatar name={selectedUser.nickname || selectedUser.username} size={36} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{selectedUser.nickname || selectedUser.username}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{roleLabel[selectedUser.role] || selectedUser.role}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 }}>开始你们的对话</div>}
              {messages.map(m => {
                const isMine = me && m.sender_id === me.id
                const isRecalled = m.is_recalled
                const canRecall = isMine && !isRecalled && (Date.now() - new Date(m.created_at).getTime()) < 2 * 60 * 1000
                const handleRecall = async () => {
                  if (!canRecall) return
                  const r = await dmApi.recall(m.id)
                  if (r.success) { toast('消息已撤回', 'success'); dmApi.history(selectedUser.id).then(r => { if (r.success) setMessages(r.data || []) }) }
                  else toast(r.message || '撤回失败', 'error')
                }
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    {isRecalled ? (
                      <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>{isMine ? '你' : (selectedUser.nickname || selectedUser.username)}撤回了一条消息</div>
                    ) : (
                      <div style={{ position: 'relative', maxWidth: '70%' }}
                        onDoubleClick={canRecall ? handleRecall : undefined}>
                        <div style={{
                          padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMine ? '#2563eb' : '#f1f5f9', color: isMine ? '#fff' : '#0f172a', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
                          cursor: canRecall ? 'pointer' : 'default'
                        }} title={canRecall ? '双击撤回' : undefined}>
                          {m.content}
                          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            {new Date(m.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="输入消息..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc' }} autoFocus />
              <button onClick={handleSend} disabled={sending || !input.trim()}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, opacity: !input.trim() ? 0.5 : 1 }}>
                <Send size={16} /> 发送
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
            <MessageSquare size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 15 }}>选择一个对话或开始新聊天</div>
          </div>
        )}
      </div>
    </div>
  )
}
