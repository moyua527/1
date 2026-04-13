import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Send, MessageSquare, Search, Loader2, UserPlus, Users, UserCheck, LogOut, Check } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { onSocket } from '../ui/smartSocket'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import useNicknameStore from '../../stores/useNicknameStore'
import useDebounce from '../../hooks/useDebounce'

const roleLabel: Record<string, string> = { admin: '管理员', member: '成员' }

const dmApi = {
  conversations: () => fetchApi('/api/dm/conversations'),
  history: (userId: number) => fetchApi(`/api/dm/${userId}/history`),
  send: (receiver_id: number, content: string) => fetchApi('/api/dm/send', { method: 'POST', body: JSON.stringify({ receiver_id, content }) }),
  recall: (id: number) => fetchApi(`/api/dm/${id}/recall`, { method: 'PATCH' }),
}

const friendApi = {
  list: () => fetchApi('/api/friends'),
  search: (keyword: string) => fetchApi(`/api/friends/search?phone=${encodeURIComponent(keyword)}`),
  request: (friend_id: number, message: string) => fetchApi('/api/friends/request', { method: 'POST', body: JSON.stringify({ friend_id, message }) }),
  requests: () => fetchApi('/api/friends/requests'),
  respond: (id: number, action: string) => fetchApi(`/api/friends/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ action }) }),
}

const groupApi = {
  list: () => fetchApi('/api/groups'),
  create: (name: string, member_ids: number[]) => fetchApi('/api/groups', { method: 'POST', body: JSON.stringify({ name, member_ids }) }),
  detail: (id: number) => fetchApi(`/api/groups/${id}`),
  history: (id: number) => fetchApi(`/api/groups/${id}/history`),
  send: (id: number, content: string) => fetchApi(`/api/groups/${id}/send`, { method: 'POST', body: JSON.stringify({ content }) }),
  recall: (groupId: number, msgId: number) => fetchApi(`/api/groups/${groupId}/messages/${msgId}/recall`, { method: 'PATCH' }),
  leave: (id: number) => fetchApi(`/api/groups/${id}/leave`, { method: 'DELETE' }),
}

export default function Messaging() {
  const [conversations, setConversations] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<any>(null)
  const pollRef = useRef<any>(null)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()
  const dn = useNicknameStore(s => s.getDisplayName)
  const [me, setMe] = useState<any>(null)

  // 添加好友
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [phoneSearch, setPhoneSearch] = useState('')
  const debouncedPhoneSearch = useDebounce(phoneSearch, 300)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [requestingId, setRequestingId] = useState<number | null>(null)

  // 群聊
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const selectedGroupRef = useRef<any>(null)
  const [groupMessages, setGroupMessages] = useState<any[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [friendsList, setFriendsList] = useState<any[]>([])
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)

  useEffect(() => { fetchApi('/api/auth/me').then(r => { if (r.success) setMe(r.data) }) }, [])

  const loadConversations = () => {
    dmApi.conversations().then(r => { if (r.success) setConversations(r.data || []) }).finally(() => setLoading(false))
  }
  const loadGroups = () => {
    groupApi.list().then(r => { if (r.success) setGroups(r.data || []) })
  }
  const loadFriends = () => {
    friendApi.requests().then(r => { if (r.success) setFriendRequests(r.data || []) })
  }

  const pullMessages = () => {
    const sel = selectedRef.current
    const grp = selectedGroupRef.current
    if (sel) {
      dmApi.history(sel.id).then(r => {
        if (r.success) setMessages(r.data || [])
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        loadConversations(); window.dispatchEvent(new Event('dm-read'))
      })
    } else if (grp) {
      groupApi.history(grp.id).then(r => {
        if (r.success) setGroupMessages(r.data || [])
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        loadGroups()
      })
    } else { loadConversations(); loadGroups(); window.dispatchEvent(new Event('dm-read')) }
  }

  useEffect(() => {
    loadConversations(); loadFriends(); loadGroups()
    const offDm = onSocket('new_dm', pullMessages)
    const offGroup = onSocket('new_group_msg', pullMessages)
    const offReconnect = onSocket('reconnect', () => { loadConversations(); loadGroups(); pullMessages() })
    const t = setInterval(() => { loadConversations(); loadGroups() }, 60000)
    return () => { clearInterval(t); offDm(); offGroup(); offReconnect() }
  }, [])

  const selectUser = (user: any) => {
    setSelectedUser(user); selectedRef.current = user
    setSelectedGroup(null); selectedGroupRef.current = null
    dmApi.history(user.id).then(r => {
      if (r.success) setMessages(r.data || [])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      loadConversations(); window.dispatchEvent(new Event('dm-read'))
    })
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      dmApi.history(user.id).then(r => {
        if (r.success) setMessages(r.data || [])
        loadConversations(); window.dispatchEvent(new Event('dm-read'))
      })
    }, 5000)
  }

  const selectGroup = (group: any) => {
    setSelectedGroup(group); selectedGroupRef.current = group
    setSelectedUser(null); selectedRef.current = null
    groupApi.history(group.id).then(r => {
      if (r.success) setGroupMessages(r.data || [])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      loadGroups()
    })
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      groupApi.history(group.id).then(r => {
        if (r.success) setGroupMessages(r.data || [])
        loadGroups()
      })
    }, 5000)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  useEffect(() => {
    if (!showAddFriend) return
    const q = debouncedPhoneSearch.trim()
    if (!q) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    let cancelled = false
    friendApi.search(q).then(r => {
      if (cancelled) return
      setSearching(false)
      if (r.success) setSearchResults(r.data || [])
    })
    return () => { cancelled = true }
  }, [debouncedPhoneSearch, showAddFriend])

  const handleSend = async () => {
    if (!input.trim()) return
    setSending(true)
    if (selectedGroup) {
      const r = await groupApi.send(selectedGroup.id, input.trim())
      setSending(false)
      if (r.success) {
        setInput('')
        window.dispatchEvent(new CustomEvent('onboarding-done', { detail: { type: 'send_message' } }))
        groupApi.history(selectedGroup.id).then(r => {
          if (r.success) setGroupMessages(r.data || [])
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
        loadGroups()
      } else toast(r.message || '发送失败', 'error')
    } else if (selectedUser) {
      const r = await dmApi.send(selectedUser.id, input.trim())
      setSending(false)
      if (r.success) {
        setInput('')
        window.dispatchEvent(new CustomEvent('onboarding-done', { detail: { type: 'send_message' } }))
        dmApi.history(selectedUser.id).then(r => {
          if (r.success) setMessages(r.data || [])
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
        loadConversations()
      } else toast(r.message || '发送失败', 'error')
    } else { setSending(false) }
  }

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)

  const handlePhoneSearch = async () => {
    if (!phoneSearch.trim()) return
    setSearching(true)
    const r = await friendApi.search(phoneSearch.trim())
    setSearching(false)
    if (r.success) setSearchResults(r.data || [])
  }

  const handleSendRequest = async (userId: number) => {
    setRequestingId(userId)
    const r = await friendApi.request(userId, '')
    setRequestingId(null)
    if (r.success) { toast('好友申请已发送', 'success'); setSearchResults(prev => prev.filter(u => u.id !== userId)) }
    else toast(r.message || '发送失败', 'error')
  }

  const handleDmRecall = useCallback(async (msgId: number) => {
    if (!selectedUser) return
    const r = await dmApi.recall(msgId)
    if (r.success) { toast('消息已撤回', 'success'); dmApi.history(selectedUser.id).then(r => { if (r.success) setMessages(r.data || []) }) }
    else toast(r.message || '撤回失败', 'error')
  }, [selectedUser])

  const handleGrpRecall = useCallback(async (msgId: number) => {
    if (!selectedGroup) return
    const r = await groupApi.recall(selectedGroup.id, msgId)
    if (r.success) { toast('消息已撤回', 'success'); groupApi.history(selectedGroup.id).then(r => { if (r.success) setGroupMessages(r.data || []) }) }
    else toast(r.message || '撤回失败', 'error')
  }, [selectedGroup])

  const handleRespondRequest = async (id: number, action: 'accept' | 'reject') => {
    const r = await friendApi.respond(id, action)
    if (r.success) { toast(action === 'accept' ? '已添加好友' : '已拒绝', 'success'); loadFriends() }
    else toast(r.message || '操作失败', 'error')
  }

  return (
    <div style={{ display: 'flex', height: isMobile ? 'calc(100dvh - 52px)' : 'calc(100vh - 80px)', background: 'var(--bg-primary)', borderRadius: isMobile ? 0 : 12, overflow: 'hidden', boxShadow: isMobile ? 'none' : '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* 左栏 */}
      <div style={{ width: isMobile ? ((selectedUser || selectedGroup) ? 0 : '100%') : 320, borderRight: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', transition: 'width 0.2s' }}>
        {/* 标题 + 操作按钮 */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={16} /> 消息
            {totalUnread > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{totalUnread > 99 ? '99+' : totalUnread}</span>}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setShowAddFriend(true); setPhoneSearch(''); setSearchResults([]) }}
              title="添加联系人"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: isMobile ? '6px 8px' : '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
              <UserPlus size={14} />{!isMobile && ' 添加联系人'}
            </button>
            <button title="添加群"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: isMobile ? '6px 8px' : '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}
              onClick={() => { setShowCreateGroup(true); setGroupName(''); setSelectedFriendIds([]); friendApi.list().then(r => { if (r.success) setFriendsList(r.data || []) }) }}>
              <Users size={14} />{!isMobile && ' 添加群'}
            </button>
          </div>
        </div>

        {/* 好友申请提示 */}
        {friendRequests.length > 0 && (
          <div style={{ borderBottom: '1px solid var(--border-secondary)' }}>
            <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: 'var(--brand)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <UserCheck size={12} /> 好友申请 ({friendRequests.length})
            </div>
            {friendRequests.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)' }}>
                <Avatar name={dn(req.user_id, req.nickname || req.username)} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>{dn(req.user_id, req.nickname || req.username)}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleRespondRequest(req.id, 'accept')}
                    style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>同意</button>
                  <button onClick={() => handleRespondRequest(req.id, 'reject')}
                    style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>拒绝</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 会话列表 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : conversations.length === 0 && groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无消息记录<br /><span style={{ fontSize: 12 }}>添加联系人后开始聊天</span></div>
          ) : (<>
            {conversations.map(c => (
              <div key={`dm-${c.id}`} onClick={() => selectUser(c)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-secondary)',
                  background: selectedUser?.id === c.id && !selectedGroup ? 'var(--bg-selected)' : 'transparent' }}
                onMouseEnter={e => { if (selectedUser?.id !== c.id || selectedGroup) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = selectedUser?.id === c.id && !selectedGroup ? 'var(--bg-selected)' : 'transparent' }}>
                <Avatar name={dn(c.id, c.nickname || c.username)} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: c.unread_count > 0 ? 700 : 500, color: 'var(--text-heading)' }}>{dn(c.id, c.nickname || c.username)}</span>
                    {c.last_time && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(c.last_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{c.last_message}</span>
                    {c.unread_count > 0 && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'var(--color-danger)', color: '#fff', fontWeight: 600, flexShrink: 0 }}>{c.unread_count}</span>}
                  </div>
                </div>
              </div>
            ))}
            {groups.length > 0 && (
              <>
                <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>群聊</div>
                {groups.map(g => (
                  <div key={`grp-${g.id}`} onClick={() => selectGroup(g)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-secondary)',
                      background: selectedGroup?.id === g.id ? 'var(--bg-selected)' : 'transparent' }}
                    onMouseEnter={e => { if (selectedGroup?.id !== g.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = selectedGroup?.id === g.id ? 'var(--bg-selected)' : 'transparent' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                      <Users size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{g.name}</span>
                        {g.last_time && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(g.last_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.last_message || `${g.member_count}人`}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>)}
        </div>
      </div>

      {/* 右栏：聊天区域 */}
      <div style={{ flex: 1, display: isMobile && !selectedUser && !selectedGroup ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile && <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, color: 'var(--text-secondary)' }}>←</button>}
              <Avatar name={dn(selectedUser.id, selectedUser.nickname || selectedUser.username)} size={36} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{dn(selectedUser.id, selectedUser.nickname || selectedUser.username)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{roleLabel[selectedUser.role] || selectedUser.role}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: 40 }}>开始你们的对话</div>}
              {messages.map(m => {
                const isMine = me && m.sender_id === me.id
                const isRecalled = m.is_recalled
                const canRecall = isMine && !isRecalled && (Date.now() - new Date(m.created_at).getTime()) < 2 * 60 * 1000
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    {isRecalled ? (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '4px 0' }}>{isMine ? '你' : dn(selectedUser.id, selectedUser.nickname || selectedUser.username)}撤回了一条消息</div>
                    ) : (
                      <div style={{ position: 'relative', maxWidth: '70%' }} onDoubleClick={canRecall ? () => handleDmRecall(m.id) : undefined}>
                        <div style={{
                          padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMine ? 'var(--brand)' : 'var(--bg-tertiary)', color: isMine ? '#fff' : 'var(--text-heading)',
                          fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', cursor: canRecall ? 'pointer' : 'default'
                        }} title={canRecall ? '双击撤回' : undefined}>
                          {m.content}
                          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>
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
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-primary)', display: 'flex', gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="输入消息..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-body)' }} autoFocus />
              <button onClick={handleSend} disabled={sending || !input.trim()}
                style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, opacity: !input.trim() ? 0.5 : 1 }}>
                <Send size={16} /> 发送
              </button>
            </div>
          </>
        ) : selectedGroup ? (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile && <button onClick={() => { setSelectedGroup(null); selectedGroupRef.current = null }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, color: 'var(--text-secondary)' }}>←</button>}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <Users size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{selectedGroup.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{selectedGroup.member_count}人</div>
              </div>
              <button onClick={async () => {
                if (!(await confirm({ message: `确定退出群聊「${selectedGroup.name}」？`, danger: true }))) return
                const r = await groupApi.leave(selectedGroup.id)
                if (r.success) { toast('已退出群聊', 'success'); setSelectedGroup(null); selectedGroupRef.current = null; loadGroups() }
                else toast(r.message || '退出失败', 'error')
              }} title="退出群聊" style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <LogOut size={14} /> 退出
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groupMessages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: 40 }}>开始群聊对话</div>}
              {groupMessages.map(m => {
                const isMine = me && m.sender_id === me.id
                const isRecalled = m.is_recalled
                const canRecall = isMine && !isRecalled && (Date.now() - new Date(m.created_at).getTime()) < 2 * 60 * 1000
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    {isRecalled ? (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '4px 0' }}>{isMine ? '你' : dn(m.sender_id, m.sender_nickname || m.sender_username)}撤回了一条消息</div>
                    ) : (
                      <div style={{ position: 'relative', maxWidth: '70%' }} onDoubleClick={canRecall ? () => handleGrpRecall(m.id) : undefined}>
                        {!isMine && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{dn(m.sender_id, m.sender_nickname || m.sender_username)}</div>}
                        <div style={{
                          padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMine ? 'var(--brand)' : 'var(--bg-tertiary)', color: isMine ? '#fff' : 'var(--text-heading)',
                          fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', cursor: canRecall ? 'pointer' : 'default'
                        }} title={canRecall ? '双击撤回' : undefined}>
                          {m.content}
                          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>
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
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-primary)', display: 'flex', gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="输入消息..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-body)' }} autoFocus />
              <button onClick={handleSend} disabled={sending || !input.trim()}
                style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, opacity: !input.trim() ? 0.5 : 1 }}>
                <Send size={16} /> 发送
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-tertiary)' }}>
            <MessageSquare size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 15 }}>选择一个对话或开始新聊天</div>
          </div>
        )}
      </div>

      <Modal open={showAddFriend} onClose={() => setShowAddFriend(false)} title="添加好友">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} placeholder="输入ID、手机号或用户名搜索..."
              onKeyDown={e => { if (e.key === 'Enter') handlePhoneSearch() }}
              style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} autoFocus />
          </div>
          <button onClick={handlePhoneSearch} disabled={searching}
            style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            {searching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>搜索结果</div>
            {searchResults.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <Avatar name={dn(u.id, u.nickname || u.username)} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{dn(u.id, u.nickname || u.username)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ID: {u.id}{u.phone ? ` · ${u.phone}` : ''}</div>
                </div>
                <button onClick={() => handleSendRequest(u.id)} disabled={requestingId === u.id}
                  style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {requestingId === u.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
                  申请添加
                </button>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && debouncedPhoneSearch.trim().length >= 1 && !searching && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>未找到匹配用户</div>
        )}

        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            💡 输入对方ID、手机号或用户名搜索，找到后点击"申请添加"。<br />
            对方同意后即可成为好友，互相发送消息。
          </div>
        </div>
      </Modal>

      <Modal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="创建群聊">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginBottom: 6, display: 'block' }}>群名称</label>
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="输入群聊名称..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} autoFocus />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginBottom: 6, display: 'block' }}>
            选择好友 {selectedFriendIds.length > 0 && <span style={{ color: 'var(--brand)', fontWeight: 400 }}>（已选 {selectedFriendIds.length} 人）</span>}
          </label>
          {friendsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>暂无好友，请先添加好友</div>
          ) : (
            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 8 }}>
              {friendsList.map((f: any) => {
                const isSelected = selectedFriendIds.includes(f.id)
                return (
                  <div key={f.id} onClick={() => {
                    setSelectedFriendIds(prev => isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id])
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    cursor: 'pointer', borderBottom: '1px solid var(--border-secondary)',
                    background: isSelected ? 'var(--bg-selected, var(--bg-secondary))' : 'transparent',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border-primary)'}`,
                      background: isSelected ? 'var(--brand)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {isSelected && <Check size={14} color="#fff" />}
                    </div>
                    <Avatar name={dn(f.id, f.nickname || f.username)} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dn(f.id, f.nickname || f.username)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button onClick={async () => {
          if (!groupName.trim()) { toast('请输入群名称', 'error'); return }
          if (selectedFriendIds.length === 0) { toast('请至少选择一位好友', 'error'); return }
          setCreatingGroup(true)
          const r = await groupApi.create(groupName.trim(), selectedFriendIds)
          setCreatingGroup(false)
          if (r.success) {
            toast('群聊创建成功', 'success')
            setShowCreateGroup(false)
            setGroupName('')
            setSelectedFriendIds([])
            groupApi.list().then(res => { if (res.success) setGroups(res.data || []) })
          } else {
            toast(r.message || '创建失败', 'error')
          }
        }} disabled={creatingGroup || !groupName.trim() || selectedFriendIds.length === 0}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            background: (!groupName.trim() || selectedFriendIds.length === 0) ? 'var(--bg-secondary)' : 'var(--brand)',
            color: (!groupName.trim() || selectedFriendIds.length === 0) ? 'var(--text-tertiary)' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          {creatingGroup ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Users size={16} />}
          {creatingGroup ? '创建中...' : '创建群聊'}
        </button>

        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            💡 输入群名称并选择好友，点击"创建群聊"即可。<br />
            群聊创建后，所有成员都可以在群内发送消息。
          </div>
        </div>
      </Modal>
    </div>
  )
}
