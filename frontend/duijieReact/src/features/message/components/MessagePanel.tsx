import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { messageApi } from '../services/api'
import Avatar from '../../ui/Avatar'

const bubble: React.CSSProperties = { padding: '8px 12px', background: '#eff6ff', borderRadius: '12px 12px 12px 4px', maxWidth: '80%', fontSize: 14, color: '#334155', lineHeight: 1.5 }

interface Props { projectId: string }

export default function MessagePanel({ projectId }: Props) {
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  const load = () => { messageApi.list(projectId).then(r => { if (r.success) setMessages(r.data?.rows || r.data || []) }) }

  useEffect(() => {
    load()
    const socket = io(window.location.origin, { path: '/socket.io', withCredentials: true })
    socketRef.current = socket
    socket.on('connect', () => { setConnected(true); socket.emit('join_project', projectId) })
    socket.on('disconnect', () => setConnected(false))
    socket.on('new_message', () => load())
    return () => { socket.emit('leave_project', projectId); socket.disconnect() }
  }, [projectId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    await messageApi.send({ project_id: Number(projectId), content: text.trim() })
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>消息</h3>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#16a34a' : '#94a3b8' }} title={connected ? '已连接' : '未连接'} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {messages.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>暂无消息</div>}
        {messages.map((m: any) => (
          <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Avatar name={m.sender_nickname || 'U'} size={28} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{m.sender_nickname || '用户'} · {new Date(m.created_at).toLocaleString('zh-CN')}</div>
              <div style={bubble}>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="输入消息..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
        <button onClick={handleSend} style={{ background: '#2563eb', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
