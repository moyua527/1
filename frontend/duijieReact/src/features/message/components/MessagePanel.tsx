import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { messageApi } from '../services/api'
import Avatar from '../../ui/Avatar'
import { isCapacitor, SERVER_URL } from '../../../utils/capacitor'
import useNicknameStore from '../../../stores/useNicknameStore'

const bubble: React.CSSProperties = { padding: '8px 12px', background: 'var(--bg-selected)', borderRadius: '12px 12px 12px 4px', maxWidth: '80%', fontSize: 14, color: 'var(--text-body)', lineHeight: 1.5 }

interface Props { projectId: string }

export default function MessagePanel({ projectId }: Props) {
  const dn = useNicknameStore(s => s.getDisplayName)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const isInitialLoad = useRef(true)

  // 加载最新消息（初始加载）
  const loadLatest = useCallback(() => {
    messageApi.list(projectId).then(r => {
      if (r.success) {
        const data = r.data?.rows || r.data || []
        setMessages(data)
        setHasMore(data.length >= 30)
        isInitialLoad.current = true
      }
    })
  }, [projectId])

  // 加载更早的消息（滚动加载）
  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    const oldestId = messages[0]?.id
    const container = scrollContainerRef.current
    const prevScrollHeight = container?.scrollHeight || 0

    const r = await messageApi.list(projectId, oldestId)
    setLoadingMore(false)
    if (r.success) {
      const older = r.data?.rows || r.data || []
      if (older.length === 0) { setHasMore(false); return }
      if (older.length < 30) setHasMore(false)
      setMessages(prev => [...older, ...prev])
      // 保持滚动位置（关键！）
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })
    }
  }, [projectId, messages, loadingMore, hasMore])

  useEffect(() => {
    loadLatest()
    const socket = io(isCapacitor ? SERVER_URL : window.location.origin, { path: '/socket.io', withCredentials: true })
    socketRef.current = socket
    socket.on('connect', () => { setConnected(true); socket.emit('join_project', projectId) })
    socket.on('disconnect', () => setConnected(false))
    socket.on('new_message', () => loadLatest())
    return () => { socket.emit('leave_project', projectId); socket.disconnect() }
  }, [projectId, loadLatest])

  // 初始加载后自动滚动到底部
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      isInitialLoad.current = false
    }
  }, [messages])

  // 监听滚动到顶部
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || loadingMore) return
    if (container.scrollTop < 60 && hasMore) {
      loadOlder()
    }
  }, [loadOlder, loadingMore, hasMore])

  const handleSend = async () => {
    if (!text.trim()) return
    const r = await messageApi.send({ project_id: Number(projectId), content: text.trim() })
    setText('')
    if (r.success) {
      loadLatest()
      // 发送后滚动到底部
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>消息</h3>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--color-success)' : 'var(--text-tertiary)' }} title={connected ? '已连接' : '未连接'} />
      </div>
      <div ref={scrollContainerRef} onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {loadingMore && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} />
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, padding: 8 }}>— 没有更多消息了 —</div>
        )}
        {messages.length === 0 && !loadingMore && <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: 20 }}>暂无消息</div>}
        {messages.map((m: any) => (
          <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Avatar name={dn(m.sender_id, m.sender_name || 'U')} size={28} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>{dn(m.sender_id, m.sender_name || '用户')} · {new Date(m.created_at).toLocaleString('zh-CN')}</div>
              <div style={bubble}>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-primary)' }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="输入消息..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
        <button onClick={handleSend} style={{ background: 'var(--brand)', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
