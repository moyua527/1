import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Trash2, Download, Eye, FileText, Image, FileSpreadsheet, Film, File, CheckSquare, Square, Search, Pencil, Link2, Plus, ExternalLink, X, StickyNote } from 'lucide-react'
import { fetchApi, BACKEND_URL } from '../../../bootstrap'
import { fileApi } from '../../file/services/api'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import FilePreviewModal from '../../file/components/FilePreviewModal'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const iconByType = (mime: string) => {
  if (mime === 'text/x-url') return <Link2 size={18} color="var(--color-info, #3b82f6)" />
  if (mime === 'text/x-note') return <StickyNote size={18} color="#f59e0b" />
  if (mime?.startsWith('image/')) return <Image size={18} color="var(--color-purple)" />
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return <FileSpreadsheet size={18} color="var(--color-success)" />
  if (mime?.includes('video') || mime?.includes('audio')) return <Film size={18} color="var(--color-danger)" />
  return <File size={18} color="var(--brand)" />
}

const canPreview = (mime: string) =>
  mime && mime !== 'text/x-url' && mime !== 'text/x-note' && (mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/') || mime.startsWith('audio/') || mime.startsWith('text/') || mime === 'application/json')

const getCategory = (mime: string) => {
  if (mime === 'text/x-url') return 'url'
  if (mime === 'text/x-note') return 'note'
  if (mime?.startsWith('image/')) return 'image'
  if (mime?.startsWith('video/') || mime?.startsWith('audio/')) return 'media'
  if (mime?.includes('pdf') || mime?.includes('word') || mime?.includes('document') || mime?.includes('text/')) return 'doc'
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return 'sheet'
  return 'other'
}

const categoryTabs = [
  { key: '', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'doc', label: '文档' },
  { key: 'note', label: '文字' },
  { key: 'url', label: '网址' },
  { key: 'sheet', label: '表格' },
  { key: 'media', label: '音视频' },
  { key: 'other', label: '其他' },
]

const addTypes = [
  { key: 'image', label: '图片', desc: '上传图片文件', icon: Image, accept: 'image/*', color: '#a855f7' },
  { key: 'doc', label: '文档', desc: 'PDF、Word、TXT 等', icon: FileText, accept: '.pdf,.doc,.docx,.txt,.md,.rtf', color: '#3b82f6' },
  { key: 'note', label: '文字', desc: '创建文字笔记', icon: StickyNote, accept: '', color: '#f59e0b' },
  { key: 'url', label: '网址', desc: '添加网址书签', icon: Link2, accept: '', color: '#06b6d4' },
  { key: 'sheet', label: '表格', desc: 'Excel、CSV 等', icon: FileSpreadsheet, accept: '.xlsx,.xls,.csv,.ppt,.pptx', color: '#22c55e' },
  { key: 'media', label: '音视频', desc: 'MP4、MP3 等', icon: Film, accept: 'video/*,audio/*,.mp4,.mp3,.wav', color: '#ef4444' },
  { key: 'other', label: '其他文件', desc: '任意类型', icon: File, accept: '', color: '#8b5cf6' },
]

interface Props {
  projectId: string
  canEdit: boolean
}

export default function ProjectFileTab({ projectId, canEdit }: Props) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [preview, setPreview] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalTab, setModalTab] = useState('image')
  const [urlInput, setUrlInput] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const [addingUrl, setAddingUrl] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [viewNote, setViewNote] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    setLoading(true)
    fileApi.list(projectId).then(r => {
      setFiles(r.success ? r.data || [] : [])
      setLoading(false)
    })
  }, [projectId])

  useEffect(() => { load() }, [load])

  const filtered = files.filter(f => {
    if (category && getCategory(f.mime_type) !== category) return false
    if (search.trim()) return (f.original_name || '').toLowerCase().includes(search.toLowerCase())
    return true
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList?.length) return
    setUploading(true)
    for (let i = 0; i < fileList.length; i++) {
      await fileApi.upload(projectId, fileList[i])
    }
    setUploading(false)
    toast(`${fileList.length}个文件上传完成`, 'success')
    load()
    e.target.value = ''
    setShowAddModal(false)
  }

  const triggerFileUpload = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept
      fileInputRef.current.click()
    }
  }

  const handleAddUrl = async () => {
    const url = urlInput.trim()
    if (!url) { toast('请输入网址', 'error'); return }
    if (!/^https?:\/\/.+/i.test(url)) { toast('请输入有效的网址（以 http:// 或 https:// 开头）', 'error'); return }
    setAddingUrl(true)
    const r = await fileApi.addUrl(projectId, url, urlTitle.trim() || undefined)
    setAddingUrl(false)
    if (r.success) {
      toast('网址已添加', 'success')
      setUrlInput('')
      setUrlTitle('')
      setShowAddModal(false)
      load()
    } else {
      toast(r.message || '添加失败', 'error')
    }
  }

  const handleAddNote = async () => {
    const content = noteContent.trim()
    if (!content) { toast('请输入内容', 'error'); return }
    setAddingNote(true)
    const r = await fileApi.addNote(projectId, content, noteTitle.trim() || undefined)
    setAddingNote(false)
    if (r.success) {
      toast('笔记已创建', 'success')
      setNoteTitle('')
      setNoteContent('')
      setShowAddModal(false)
      load()
    } else {
      toast(r.message || '创建失败', 'error')
    }
  }

  const handleDelete = async (f: any) => {
    if (!(await confirm({ message: `确定删除"${f.original_name}"？`, danger: true }))) return
    const r = await fileApi.remove(String(f.id))
    if (r.success) { toast('已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleBatchDelete = async () => {
    if (!selected.size) return
    if (!(await confirm({ message: `确定删除选中的 ${selected.size} 项？`, danger: true }))) return
    let ok = 0
    for (const id of selected) {
      const r = await fetchApi(`/api/files/${id}`, { method: 'DELETE' })
      if (r.success) ok++
    }
    toast(`已删除 ${ok} 项`, 'success')
    setSelected(new Set())
    load()
  }

  const handleDownload = (f: any) => { window.open(`${BACKEND_URL}/api/files/${f.id}/download`, '_blank') }

  const getPreviewUrl = (f: any) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    return `${BACKEND_URL}/api/files/${f.id}/preview?token=${token}`
  }

  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0)
  const currentAddType = addTypes.find(t => t.key === modalTab)

  return (
    <div style={section}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>资料库</h3>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{files.length} 个文件 · {formatSize(totalSize)}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {editing && selected.size > 0 && (
            <button onClick={handleBatchDelete} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--bg-danger-hover)', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              <Trash2 size={14} /> 删除 ({selected.size})
            </button>
          )}
          {canEdit && (
            <>
              <Button onClick={() => { setShowAddModal(true); setModalTab('image') }}>
                <Plus size={14} /> 添加
              </Button>
              <Button variant={editing ? 'secondary' : 'ghost'} onClick={() => { setEditing(v => !v); setSelected(new Set()) }}>
                {editing ? '完成' : <><Pencil size={14} /> 管理</>}
              </Button>
            </>
          )}
          <input ref={fileInputRef} type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件..."
            style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
        </div>
        {categoryTabs.map(t => (
          <button key={t.key} onClick={() => { setCategory(t.key); setSelected(new Set()) }}
            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 500, background: category === t.key ? 'var(--brand)' : 'var(--bg-tertiary)', color: category === t.key ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
          {category === 'url' ? <Link2 size={32} style={{ marginBottom: 8, opacity: 0.5 }} /> : <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />}
          <div style={{ fontSize: 14 }}>{search || category ? (category === 'url' ? '暂无网址' : '未找到匹配文件') : '暂无文件'}</div>
          {!search && canEdit && <div style={{ fontSize: 12, marginTop: 4 }}>点击「添加」上传文件或添加网址</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {filtered.map(f => {
            const isUrl = f.mime_type === 'text/x-url'
            const isNote = f.mime_type === 'text/x-note'
            const isSpecial = isUrl || isNote
            const isImg = f.mime_type?.startsWith('image/')
            const thumbUrl = isImg ? `${BACKEND_URL}/api/files/${f.id}/preview?token=${localStorage.getItem('token') || ''}` : ''
            return (
              <div key={f.id}
                style={{
                  position: 'relative', borderRadius: 12, border: selected.has(f.id) ? '2px solid var(--brand)' : '1px solid var(--border-primary)',
                  background: 'var(--bg-primary)', overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                onClick={() => {
                  if (isNote) setViewNote(f)
                  else if (isUrl) window.open(f.path, '_blank')
                  else if (canPreview(f.mime_type)) setPreview(f)
                }}>
                {/* 缩略图 / 图标区域 */}
                <div style={{
                  height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isImg ? '#000' : 'var(--bg-secondary)',
                  overflow: 'hidden',
                }}>
                  {isImg ? (
                    <img src={thumbUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', width: '100%', height: '100%' }} />
                  ) : (
                    <div style={{ transform: 'scale(1.8)', opacity: 0.6 }}>{iconByType(f.mime_type)}</div>
                  )}
                </div>
                {/* 信息区 */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: isUrl ? 'var(--brand)' : isNote ? '#f59e0b' : 'var(--text-heading)',
                  }}>
                    {f.original_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isUrl ? f.path : isNote ? `${f.path?.substring(0, 40)}...` : `${formatSize(f.size || 0)} · ${new Date(f.created_at).toLocaleDateString('zh-CN')}`}
                  </div>
                </div>
                {/* 操作条 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2, padding: '0 8px 8px', flexWrap: 'wrap' }}>
                  {isUrl && (
                    <button onClick={e => { e.stopPropagation(); window.open(f.path, '_blank') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand)', display: 'flex', borderRadius: 4 }} title="打开链接">
                      <ExternalLink size={14} />
                    </button>
                  )}
                  {!isSpecial && canPreview(f.mime_type) && (
                    <button onClick={e => { e.stopPropagation(); setPreview(f) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-purple)', display: 'flex', borderRadius: 4 }} title="预览">
                      <Eye size={14} />
                    </button>
                  )}
                  {!isSpecial && (
                    <button onClick={e => { e.stopPropagation(); handleDownload(f) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand)', display: 'flex', borderRadius: 4 }} title="下载">
                      <Download size={14} />
                    </button>
                  )}
                  {editing && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(f) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-danger)', display: 'flex', borderRadius: 4 }} title="删除">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {/* 选中复选框 */}
                {editing && (
                  <button onClick={e => { e.stopPropagation(); setSelected(prev => { const s = new Set(prev); s.has(f.id) ? s.delete(f.id) : s.add(f.id); return s }) }}
                    style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 4, color: selected.has(f.id) ? 'var(--brand)' : 'var(--text-tertiary)', display: 'flex', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                    {selected.has(f.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {preview && (
        <FilePreviewModal file={preview} previewUrl={getPreviewUrl(preview)} onDownload={handleDownload} onClose={() => setPreview(null)} />
      )}

      {/* 笔记查看弹窗 */}
      {viewNote && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setViewNote(null) }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', background: 'var(--bg-primary)', borderRadius: 16, width: '90%', maxWidth: 520, maxHeight: '70vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StickyNote size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{viewNote.original_name}</h3>
              </div>
              <button onClick={() => setViewNote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20, overflow: 'auto', flex: 1, fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {viewNote.path}
            </div>
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-primary)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              创建于 {new Date(viewNote.created_at).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      )}

      {/* 添加资料弹窗 */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', background: 'var(--bg-primary)', borderRadius: 16, width: '90%', maxWidth: 520, maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
            {/* 头部 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>添加资料</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <X size={18} />
              </button>
            </div>

            {/* 类型选择下拉框 */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)' }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>资料类型</label>
              <select value={modalTab} onChange={e => setModalTab(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-heading)', cursor: 'pointer', appearance: 'auto' }}>
                {addTypes.map(t => (
                  <option key={t.key} value={t.key}>{t.label} — {t.desc}</option>
                ))}
              </select>
            </div>

            {/* 内容区 */}
            <div style={{ padding: 20, flex: 1, overflow: 'auto' }}>
              {currentAddType && currentAddType.key === 'note' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>标题（选填）</label>
                    <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="笔记标题"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                      autoFocus />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>内容 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="输入文字内容..."
                      rows={6}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  </div>
                  <Button disabled={addingNote} onClick={handleAddNote} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                    {addingNote ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                    {addingNote ? '创建中...' : '创建笔记'}
                  </Button>
                </div>
              ) : currentAddType && currentAddType.key === 'url' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>网址 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                      autoFocus />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>标题（选填）</label>
                    <input value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="网站名称"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddUrl() }} />
                  </div>
                  <Button disabled={addingUrl} onClick={handleAddUrl} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                    {addingUrl ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                    {addingUrl ? '添加中...' : '添加网址'}
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div
                    onClick={() => !uploading && currentAddType && triggerFileUpload(currentAddType.accept)}
                    style={{
                      width: '100%', padding: '40px 20px', border: '2px dashed var(--border-primary)', borderRadius: 14,
                      textAlign: 'center', cursor: uploading ? 'default' : 'pointer', transition: 'all 0.15s',
                      background: 'var(--bg-secondary)',
                    }}
                    onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = currentAddType?.color || 'var(--brand)'; e.currentTarget.style.background = `color-mix(in srgb, ${currentAddType?.color || 'var(--brand)'} 4%, var(--bg-secondary))` } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.background = 'var(--bg-secondary)' }}>
                    {uploading ? (
                      <>
                        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: currentAddType?.color, marginBottom: 10 }} />
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>上传中...</div>
                      </>
                    ) : (
                      <>
                        {currentAddType && <currentAddType.icon size={36} color={currentAddType.color} style={{ marginBottom: 10 }} />}
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>点击选择{currentAddType?.label || '文件'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{currentAddType?.desc}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>支持多选 · 单文件最大 100MB</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
