import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Send, Loader2, ImagePlus, X, Pencil, Paperclip, FileText } from 'lucide-react'
import { messageApi } from '../services/api'
import Avatar from '../../ui/Avatar'
import { isCapacitor, SERVER_URL } from '../../../utils/capacitor'
import useNicknameStore from '../../../stores/useNicknameStore'
import ImageViewer from '../../ui/ImageViewer'
import ImageEditor from '../../ui/ImageEditor'
import { onSocket, joinProject, leaveProject, isConnected } from '../../ui/smartSocket'
import useIsMobile from '../../ui/useIsMobile'

const bubble: React.CSSProperties = { padding: '8px 12px', background: 'var(--bg-selected)', borderRadius: '12px 12px 12px 4px', maxWidth: '80%', fontSize: 14, color: 'var(--text-body)', lineHeight: 1.5 }
const IMG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])
function isImageFile(name: string) {
  const ext = (name || '').toLowerCase().match(/\.[^.]+$/)?.[0] || ''
  return IMG_EXTS.has(ext)
}
function getUploadUrl(filename: string) {
  const base = isCapacitor ? SERVER_URL : ''
  return `${base}/uploads/${filename}`
}

interface Props { projectId: string }

export default function MessagePanel({ projectId }: Props) {
  const isMobile = useIsMobile()
  const dn = useNicknameStore(s => s.getDisplayName)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(isConnected())
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [imageFromUpload, setImageFromUpload] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editingImage, setEditingImage] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pendingImageUrl = useMemo(() => pendingImage ? URL.createObjectURL(pendingImage) : null, [pendingImage])
  useEffect(() => { return () => { if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl) } }, [pendingImageUrl])

  const loadLatest = useCallback(async () => {
    try {
      const r = await messageApi.list(projectId)
      if (r.success) {
        const data = r.data?.rows || r.data || []
        setMessages(data)
        setHasMore(data.length >= 30)
        isInitialLoad.current = true
      }
    } catch { /* network error, silent */ }
  }, [projectId])

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore || messagesRef.current.length === 0) return
    setLoadingMore(true)
    const oldestId = messagesRef.current[0]?.id
    const container = scrollContainerRef.current
    const prevScrollHeight = container?.scrollHeight || 0

    try {
      const r = await messageApi.list(projectId, oldestId)
      setLoadingMore(false)
      if (r.success) {
        const older = r.data?.rows || r.data || []
        if (older.length === 0) { setHasMore(false); return }
        if (older.length < 30) setHasMore(false)
        setMessages(prev => [...older, ...prev])
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight
          }
        })
      }
    } catch {
      setLoadingMore(false)
    }
  }, [projectId, loadingMore, hasMore])

  useEffect(() => {
    loadLatest()
    joinProject(projectId)
    const offMsg = onSocket('new_message', (payload: any) => {
      if (String(payload?.project_id) === String(projectId)) {
        loadLatest()
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 150)
      }
    })
    const offReconnect = onSocket('reconnect', () => { setConnected(true); loadLatest() })
    const connCheck = setInterval(() => setConnected(isConnected()), 5000)
    setConnected(isConnected())
    return () => { leaveProject(projectId); offMsg(); offReconnect(); clearInterval(connCheck) }
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
    if (!text.trim() && !pendingImage && !pendingFile) return
    setSending(true)
    try {
      let r
      if (pendingImage) {
        r = await messageApi.sendImage(Number(projectId), pendingImage)
        setPendingImage(null)
      } else if (pendingFile) {
        r = await messageApi.sendFile(Number(projectId), pendingFile)
        setPendingFile(null)
      } else {
        r = await messageApi.send({ project_id: Number(projectId), content: text.trim() })
      }
      setText('')
      if (r.success) {
        loadLatest()
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch { /* network error */ }
    setSending(false)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) { setPendingImage(file); setImageFromUpload(false); setPendingFile(null) }
    else { setPendingFile(file); setPendingImage(null) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) { setPendingImage(file); setImageFromUpload(true); setPendingFile(null) }
    else { setPendingFile(file); setPendingImage(null) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setPendingImage(file)
      setImageFromUpload(true)
    }
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          setPendingImage(file)
          setImageFromUpload(false)
        }
        return
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1 }}>
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>消息</h3>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--color-success)' : 'var(--text-tertiary)' }} title={connected ? '已连接' : '未连接'} />
        </div>
      )}
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
        {messages.map((m: any) => {
          const isImg = m.type === 'file' && isImageFile(m.content)
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Avatar name={dn(m.sender_id, m.sender_name || 'U')} size={28} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>{dn(m.sender_id, m.sender_name || '用户')} · {new Date(m.created_at).toLocaleString('zh-CN')}</div>
                {isImg ? (
                  <img src={getUploadUrl(m.content)} alt="" loading="lazy" onClick={() => setPreviewSrc(getUploadUrl(m.content))}
                    style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, cursor: 'pointer', display: 'block' }} />
                ) : (
                  <div style={bubble}>{m.content}</div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 待发送文件预览 */}
      {(pendingImage || pendingFile) && (
        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {pendingImage && pendingImageUrl ? (
              <img src={pendingImageUrl} alt="" style={{ maxWidth: 100, maxHeight: 80, borderRadius: 6 }} />
            ) : pendingFile ? (
              <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <FileText size={24} color="var(--text-tertiary)" />
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{pendingFile.name.split('.').pop()}</span>
              </div>
            ) : null}
            <button onClick={() => { setPendingImage(null); setPendingFile(null); setImageFromUpload(false) }}
              style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--color-danger)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={10} />
            </button>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{pendingImage?.name || pendingFile?.name}</span>
          {pendingImage && imageFromUpload && (
            <button onClick={() => setEditingImage(pendingImage)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
              <Pencil size={12} /> 编辑
            </button>
          )}
        </div>
      )}

      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${isDragging ? 'var(--brand)' : 'var(--border-primary)'}`, alignItems: 'center', background: isDragging ? 'var(--bg-selected)' : 'transparent', borderRadius: isDragging ? 8 : 0, transition: 'all 0.15s', padding: isDragging ? '12px 8px' : '12px 0 0 0' }}>
        <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />
        <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} />
        <button onClick={() => imgInputRef.current?.click()} title="发送图片"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ImagePlus size={20} />
        </button>
        <button onClick={() => fileInputRef.current?.click()} title="发送文件"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <Paperclip size={20} />
        </button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} disabled={!!pendingImage || !!pendingFile}
          placeholder={pendingImage ? '点击发送图片...' : pendingFile ? '点击发送文件...' : '输入消息... (可拖拽文件进来)'}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
        <button onClick={handleSend} disabled={sending}
          style={{ background: 'var(--brand)', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', opacity: sending ? 0.6 : 1 }}>
          <Send size={16} />
        </button>
      </div>

      {previewSrc && <ImageViewer src={previewSrc} onClose={() => setPreviewSrc(null)} />}
      {editingImage && <ImageEditor imageFile={editingImage} onConfirm={(editedFile) => {
        setPendingImage(editedFile)
        setEditingImage(null)
      }} onCancel={() => setEditingImage(null)} />}
    </div>
  )
}
