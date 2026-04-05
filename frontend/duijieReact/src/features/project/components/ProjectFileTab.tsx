import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Loader2, Trash2, Download, Eye, FileText, Image, FileSpreadsheet, Film, File, CheckSquare, Square, Search, Pencil, Link2, Plus, ExternalLink } from 'lucide-react'
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
  if (mime?.startsWith('image/')) return <Image size={18} color="var(--color-purple)" />
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return <FileSpreadsheet size={18} color="var(--color-success)" />
  if (mime?.includes('video') || mime?.includes('audio')) return <Film size={18} color="var(--color-danger)" />
  return <File size={18} color="var(--brand)" />
}

const canPreview = (mime: string) =>
  mime && mime !== 'text/x-url' && (mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/') || mime.startsWith('audio/') || mime.startsWith('text/') || mime === 'application/json')

const getCategory = (mime: string) => {
  if (mime === 'text/x-url') return 'url'
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
  { key: 'url', label: '网址' },
  { key: 'sheet', label: '表格' },
  { key: 'media', label: '音视频' },
  { key: 'other', label: '其他' },
]

const acceptMap: Record<string, string> = {
  '': '',
  image: 'image/*',
  doc: '.pdf,.doc,.docx,.txt,.md,.rtf',
  sheet: '.xlsx,.xls,.csv,.ppt,.pptx',
  media: 'video/*,audio/*,.mp4,.mp3,.wav',
  other: '',
}

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
  const [showUrlForm, setShowUrlForm] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const [addingUrl, setAddingUrl] = useState(false)
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
      setShowUrlForm(false)
      load()
    } else {
      toast(r.message || '添加失败', 'error')
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
  const isUrlCategory = category === 'url'

  const uploadLabel = (() => {
    switch (category) {
      case 'image': return '上传图片'
      case 'doc': return '上传文档'
      case 'sheet': return '上传表格'
      case 'media': return '上传音视频'
      default: return '上传文件'
    }
  })()

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptMap[category] || ''
      fileInputRef.current.click()
    }
  }

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
          {editing && !isUrlCategory && (
            <Button disabled={uploading} onClick={handleUploadClick}>
              {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
              {uploading ? '上传中...' : uploadLabel}
            </Button>
          )}
          {editing && isUrlCategory && (
            <Button onClick={() => setShowUrlForm(v => !v)}>
              <Plus size={14} /> 添加网址
            </Button>
          )}
          {canEdit && (
            <Button variant={editing ? 'secondary' : 'primary'} onClick={() => { setEditing(v => !v); setSelected(new Set()); setShowUrlForm(false) }}>
              {editing ? '完成' : <><Pencil size={14} /> 编辑</>}
            </Button>
          )}
          <input ref={fileInputRef} type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />
        </div>
      </div>

      {/* URL input form */}
      {editing && showUrlForm && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end', padding: 12, background: 'var(--bg-secondary)', borderRadius: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>网址 *</label>
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>标题（选填）</label>
            <input value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="网站名称"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', boxSizing: 'border-box' }}
              onKeyDown={e => { if (e.key === 'Enter') handleAddUrl() }} />
          </div>
          <Button disabled={addingUrl} onClick={handleAddUrl}>
            {addingUrl ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
            {addingUrl ? '添加中...' : '添加'}
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件..."
            style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
        </div>
        {categoryTabs.map(t => (
          <button key={t.key} onClick={() => { setCategory(t.key); setSelected(new Set()); setShowUrlForm(false) }}
            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 500, background: category === t.key ? 'var(--brand)' : 'var(--bg-tertiary)', color: category === t.key ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
          {isUrlCategory ? <Link2 size={32} style={{ marginBottom: 8, opacity: 0.5 }} /> : <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />}
          <div style={{ fontSize: 14 }}>{search || category ? (isUrlCategory ? '暂无网址' : '未找到匹配文件') : '暂无文件'}</div>
          {!search && canEdit && <div style={{ fontSize: 12, marginTop: 4 }}>点击「编辑」{isUrlCategory ? '添加网址' : '上传文件'}</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(f => {
            const isUrl = f.mime_type === 'text/x-url'
            return (
              <div key={f.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: selected.has(f.id) ? 'var(--bg-selected)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!selected.has(f.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                onMouseLeave={e => { if (!selected.has(f.id)) e.currentTarget.style.background = 'transparent' }}>
                {editing && (
                  <button onClick={() => setSelected(prev => { const s = new Set(prev); s.has(f.id) ? s.delete(f.id) : s.add(f.id); return s })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: selected.has(f.id) ? 'var(--brand)' : 'var(--text-tertiary)', display: 'flex', flexShrink: 0 }}>
                    {selected.has(f.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                )}
                {iconByType(f.mime_type)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isUrl ? (
                    <a href={f.path} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                      onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                      onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
                      {f.original_name}
                    </a>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {isUrl ? (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 300 }}>{f.path}</span>
                    ) : (
                      <>{formatSize(f.size || 0)} · {new Date(f.created_at).toLocaleDateString('zh-CN')}</>
                    )}
                    {' · '}{new Date(f.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {isUrl && (
                    <a href={f.path} target="_blank" rel="noopener noreferrer"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand)', display: 'flex' }} title="打开链接">
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {!isUrl && canPreview(f.mime_type) && <button onClick={() => setPreview(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-purple)' }} title="预览"><Eye size={16} /></button>}
                  {!isUrl && <button onClick={() => handleDownload(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand)' }} title="下载"><Download size={16} /></button>}
                  {editing && <button onClick={() => handleDelete(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-danger)' }} title="删除"><Trash2 size={16} /></button>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {preview && (
        <FilePreviewModal file={preview} previewUrl={getPreviewUrl(preview)} onDownload={handleDownload} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
