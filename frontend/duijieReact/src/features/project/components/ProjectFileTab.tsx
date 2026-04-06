import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Trash2, Download, Eye, FileText, Image, FileSpreadsheet, Film, File, CheckSquare, Square, Search, Pencil, Link2, Plus, ExternalLink, X, StickyNote, Paperclip, FolderOpen, Users, Lock, Globe } from 'lucide-react'
import { fetchApi, BACKEND_URL } from '../../../bootstrap'
import { fileApi, resourceGroupApi } from '../../file/services/api'
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

const ensureUrlProtocol = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`

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
  members?: any[]
  currentUserId?: number
}

export default function ProjectFileTab({ projectId, canEdit, members = [], currentUserId }: Props) {
  const [viewMode, setViewMode] = useState<'groups' | 'files'>('groups')
  const [groups, setGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupVisibility, setGroupVisibility] = useState<'all' | 'selected'>('all')
  const [groupSelectedUsers, setGroupSelectedUsers] = useState<number[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [activeGroup, setActiveGroup] = useState<any>(null)
  const [groupDetail, setGroupDetail] = useState<any>(null)
  const [groupDetailLoading, setGroupDetailLoading] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [itemType, setItemType] = useState<'url' | 'text' | 'file' | ''>('')
  const [itemUrl, setItemUrl] = useState('')
  const [itemTitle, setItemTitle] = useState('')
  const [itemContent, setItemContent] = useState('')
  const groupFileRef = useRef<HTMLInputElement>(null)
  const [editingItem, setEditingItem] = useState<{ id: number; title: string; url: string; content: string; description: string; mime_type: string } | null>(null)
  const [editingVisibility, setEditingVisibility] = useState(false)
  const [editVisibility, setEditVisibility] = useState<'all' | 'selected'>('all')
  const [editVisibleUsers, setEditVisibleUsers] = useState<number[]>([])

  const isGroupCreator = (g: any) => g && currentUserId && String(g.created_by) === String(currentUserId)

  const handleUpdateVisibility = async () => {
    if (!activeGroup) return
    const r = await resourceGroupApi.update(String(activeGroup.id), { visibility: editVisibility, visible_users: editVisibility === 'selected' ? editVisibleUsers : [] })
    if (r.success) {
      toast('可见性已更新', 'success')
      setEditingVisibility(false)
      const updated = { ...activeGroup, visibility: editVisibility }
      setActiveGroup(updated)
      loadGroups()
      openGroupDetail(updated)
    } else toast(r.message || '更新失败', 'error')
  }

  const loadGroups = useCallback(() => {
    setGroupsLoading(true)
    resourceGroupApi.list(projectId).then(r => {
      setGroups(r.success ? r.data || [] : [])
      setGroupsLoading(false)
    })
  }, [projectId])

  useEffect(() => { loadGroups() }, [loadGroups])

  const handleCreateGroup = async () => {
    if (!groupName.trim()) { toast('请输入资料名称', 'error'); return }
    setCreatingGroup(true)
    const r = await resourceGroupApi.create({
      project_id: projectId,
      name: groupName.trim(),
      visibility: groupVisibility,
      visible_users: groupVisibility === 'selected' ? groupSelectedUsers : undefined,
    })
    setCreatingGroup(false)
    if (r.success) {
      toast('资料已创建', 'success')
      setGroupName(''); setGroupVisibility('all'); setGroupSelectedUsers([])
      setShowCreateGroup(false)
      loadGroups()
    } else toast(r.message || '创建失败', 'error')
  }

  const openGroupDetail = async (g: any) => {
    setActiveGroup(g)
    setGroupDetailLoading(true)
    const r = await resourceGroupApi.detail(String(g.id))
    setGroupDetailLoading(false)
    if (r.success) setGroupDetail(r.data)
    else toast(r.message || '加载失败', 'error')
  }

  const handleDeleteGroup = async (g: any) => {
    if (!(await confirm({ message: `确定删除「${g.name}」及其所有内容？`, danger: true }))) return
    const r = await resourceGroupApi.remove(String(g.id))
    if (r.success) { toast('已删除', 'success'); setActiveGroup(null); setGroupDetail(null); loadGroups() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleAddGroupItem = async () => {
    if (!groupDetail) return
    if (itemType === 'url') {
      if (!itemUrl.trim()) { toast('请输入网址', 'error'); return }
      const normalizedUrl = ensureUrlProtocol(itemUrl.trim())
      setAddingItem(true)
      await resourceGroupApi.addItem({ group_id: groupDetail.id, type: 'url', url: normalizedUrl, title: itemTitle.trim() || undefined, content: itemContent.trim() || undefined })
    } else if (itemType === 'text') {
      if (!itemContent.trim()) { toast('请输入文字内容', 'error'); return }
      setAddingItem(true)
      await resourceGroupApi.addItem({ group_id: groupDetail.id, type: 'text', content: itemContent.trim(), title: itemTitle.trim() || undefined })
    }
    setAddingItem(false)
    setItemType(''); setItemUrl(''); setItemTitle(''); setItemContent('')
    openGroupDetail(activeGroup)
  }

  const handleGroupFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files
    if (!fl?.length || !groupDetail) return
    setAddingItem(true)
    for (let i = 0; i < fl.length; i++) {
      await resourceGroupApi.addFile(groupDetail.id, fl[i])
    }
    setAddingItem(false)
    toast(`${fl.length}个文件已添加`, 'success')
    e.target.value = ''
    openGroupDetail(activeGroup)
  }
  const handleDeleteItem = async (item: any) => {
    if (!(await confirm({ message: `确定删除「${item.original_name}」？`, danger: true }))) return
    const r = await resourceGroupApi.deleteItem(item.id)
    if (r.success) { toast('已删除', 'success'); openGroupDetail(activeGroup) }
    else toast(r.message || '删除失败', 'error')
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    const data: any = {}
    if (editingItem.mime_type === 'text/x-url') {
      data.title = editingItem.title
      data.url = editingItem.url
      data.description = editingItem.description
    } else if (editingItem.mime_type === 'text/x-note') {
      data.title = editingItem.title
      data.content = editingItem.content
    }
    const r = await resourceGroupApi.updateItem(editingItem.id, data)
    if (r.success) { toast('已更新', 'success'); setEditingItem(null); openGroupDetail(activeGroup) }
    else toast(r.message || '更新失败', 'error')
  }

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
  const [urlDesc, setUrlDesc] = useState('')
  const [addingUrl, setAddingUrl] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [noteFiles, setNoteFiles] = useState<File[]>([])
  const [noteDragging, setNoteDragging] = useState(false)
  const [viewNote, setViewNote] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const noteFileRef = useRef<HTMLInputElement>(null)

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
    const normalizedUrl = ensureUrlProtocol(url)
    setAddingUrl(true)
    const r = await fileApi.addUrl(projectId, normalizedUrl, urlTitle.trim() || undefined, urlDesc.trim() || undefined)
    setAddingUrl(false)
    if (r.success) {
      toast('网址已添加', 'success')
      setUrlInput('')
      setUrlTitle('')
      setUrlDesc('')
      setShowAddModal(false)
      load()
    } else {
      toast(r.message || '添加失败', 'error')
    }
  }

  const handleAddNote = async () => {
    const content = noteContent.trim()
    if (!content && noteFiles.length === 0) { toast('请输入内容或添加附件', 'error'); return }
    setAddingNote(true)
    if (content) {
      const r = await fileApi.addNote(projectId, content, noteTitle.trim() || undefined)
      if (!r.success) { toast(r.message || '创建失败', 'error'); setAddingNote(false); return }
    }
    for (const f of noteFiles) {
      await fileApi.upload(projectId, f)
    }
    setAddingNote(false)
    toast(noteFiles.length > 0 ? '笔记和附件已创建' : '笔记已创建', 'success')
    setNoteTitle(''); setNoteContent(''); setNoteFiles([])
    setShowAddModal(false)
    load()
  }

  const handleNoteDragOver = (e: React.DragEvent) => { e.preventDefault(); setNoteDragging(true) }
  const handleNoteDragLeave = () => setNoteDragging(false)
  const handleNoteDrop = (e: React.DragEvent) => { e.preventDefault(); setNoteDragging(false); if (e.dataTransfer.files.length) setNoteFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]) }
  const handleNotePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imgs: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile()
        if (f) imgs.push(f)
      }
    }
    if (imgs.length) { e.preventDefault(); setNoteFiles(prev => [...prev, ...imgs]) }
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

  const currentAddType = addTypes.find(t => t.key === modalTab)

  return (
    <div style={section}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>资料库</h3>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {(['groups', 'files'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ padding: '3px 10px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 500, background: viewMode === m ? 'var(--brand)' : 'var(--bg-tertiary)', color: viewMode === m ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                {m === 'groups' ? '资料组' : '全部文件'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {viewMode === 'files' && editing && selected.size > 0 && (
            <button onClick={handleBatchDelete} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--bg-danger-hover)', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              <Trash2 size={14} /> 删除 ({selected.size})
            </button>
          )}
          {canEdit && viewMode === 'groups' && (
            <Button onClick={() => setShowCreateGroup(true)}>
              <Plus size={14} /> 添加
            </Button>
          )}
          {canEdit && viewMode === 'files' && (
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

      {viewMode === 'groups' ? (
        <div>
          {groupsLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} /></div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
              <FolderOpen size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div style={{ fontSize: 14 }}>暂无资料</div>
              {canEdit && <div style={{ fontSize: 12, marginTop: 4 }}>点击「添加」创建资料</div>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {groups.map((g: any) => (
                <div key={g.id}
                  onClick={() => openGroupDetail(g)}
                  style={{ position: 'relative', padding: 16, borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <FolderOpen size={20} color="var(--brand)" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{g.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span>{g.item_count || 0} 项</span>
                    <span>·</span>
                    <span>{g.creator_name || g.creator_username}</span>
                    {g.visibility === 'selected' && <Lock size={11} />}
                  </div>
                  {canEdit && g.created_by === currentUserId && (
                    <button onClick={e => { e.stopPropagation(); handleDeleteGroup(g) }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <>
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
                  else if (isUrl) window.open(ensureUrlProtocol(f.path), '_blank')
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
                  {isUrl && f.description && (
                    <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                      {f.description}
                    </div>
                  )}
                </div>
                {/* 操作条 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2, padding: '0 8px 8px', flexWrap: 'wrap' }}>
                  {isUrl && (
                    <button onClick={e => { e.stopPropagation(); window.open(ensureUrlProtocol(f.path), '_blank') }}
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

      </>
      )}

      {/* 创建资料组弹窗 */}
      {showCreateGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateGroup(false) }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', background: 'var(--bg-primary)', borderRadius: 16, width: '90%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>创建资料</h3>
              <button onClick={() => setShowCreateGroup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>资料名称 <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="例如：项目文档、设计稿、链接合集"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                  autoFocus onKeyDown={e => { if (e.key === 'Enter') handleCreateGroup() }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>可见性</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setGroupVisibility('all')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, border: groupVisibility === 'all' ? '2px solid var(--brand)' : '1px solid var(--border-primary)', background: groupVisibility === 'all' ? 'rgba(59,130,246,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: groupVisibility === 'all' ? 600 : 400, color: groupVisibility === 'all' ? 'var(--brand)' : 'var(--text-secondary)' }}>
                    <Globe size={14} /> 全部可见
                  </button>
                  <button onClick={() => setGroupVisibility('selected')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, border: groupVisibility === 'selected' ? '2px solid #f59e0b' : '1px solid var(--border-primary)', background: groupVisibility === 'selected' ? 'rgba(245,158,11,0.06)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: groupVisibility === 'selected' ? 600 : 400, color: groupVisibility === 'selected' ? '#f59e0b' : 'var(--text-secondary)' }}>
                    <Lock size={14} /> 指定成员
                  </button>
                </div>
              </div>
              {groupVisibility === 'selected' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>选择可查看的成员</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflow: 'auto' }}>
                    {members.map((m: any) => {
                      const uid = m.user_id || m.id
                      const name = m.nickname || m.username || '?'
                      const sel = groupSelectedUsers.includes(uid)
                      return (
                        <button key={uid} onClick={() => setGroupSelectedUsers(prev => sel ? prev.filter(id => id !== uid) : [...prev, uid])}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: sel ? '1.5px solid var(--brand)' : '1px solid var(--border-primary)', background: sel ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: sel ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: sel ? 600 : 400 }}>
                          <Users size={12} /> {name}
                        </button>
                      )
                    })}
                  </div>
                  {groupSelectedUsers.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>请至少选择一位成员</div>}
                </div>
              )}
              <Button disabled={creatingGroup} onClick={handleCreateGroup} style={{ alignSelf: 'flex-end' }}>
                {creatingGroup ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                {creatingGroup ? '创建中...' : '创建资料'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 资料组详情弹窗 */}
      {activeGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) { setActiveGroup(null); setGroupDetail(null); setItemType('') } }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', background: 'var(--bg-primary)', borderRadius: 16, width: '90%', maxWidth: 600, maxHeight: '80vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{activeGroup.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>创建人：{activeGroup.creator_name || activeGroup.creator_username}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>·</span>
                  <span style={{ fontSize: 11, color: activeGroup.visibility === 'selected' ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #22c55e)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {activeGroup.visibility === 'selected' ? <><Lock size={10} /> 指定成员可见</> : <><Globe size={10} /> 全部可见</>}
                  </span>
                </div>
              </div>
              <button onClick={() => { setActiveGroup(null); setGroupDetail(null); setItemType(''); setEditingVisibility(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}><X size={18} /></button>
            </div>
            {editingVisibility && isGroupCreator(activeGroup) && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-heading)' }}>修改可见性</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button onClick={() => setEditVisibility('all')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: editVisibility === 'all' ? '2px solid var(--brand)' : '1px solid var(--border-primary)', background: editVisibility === 'all' ? 'rgba(59,130,246,0.08)' : 'var(--bg-primary)', cursor: 'pointer', fontSize: 13, color: editVisibility === 'all' ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: editVisibility === 'all' ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Globe size={14} /> 全部可见
                  </button>
                  <button onClick={() => setEditVisibility('selected')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: editVisibility === 'selected' ? '2px solid var(--brand)' : '1px solid var(--border-primary)', background: editVisibility === 'selected' ? 'rgba(59,130,246,0.08)' : 'var(--bg-primary)', cursor: 'pointer', fontSize: 13, color: editVisibility === 'selected' ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: editVisibility === 'selected' ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Lock size={14} /> 指定成员
                  </button>
                </div>
                {editVisibility === 'selected' && (
                  <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, padding: 8, borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
                    {members.filter(m => m.user_id !== currentUserId).map(m => {
                      const sel = editVisibleUsers.includes(m.user_id)
                      return (
                        <button key={m.user_id} onClick={() => setEditVisibleUsers(sel ? editVisibleUsers.filter(id => id !== m.user_id) : [...editVisibleUsers, m.user_id])}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 16, border: sel ? '1px solid var(--brand)' : '1px solid var(--border-primary)', background: sel ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: sel ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: sel ? 500 : 400, transition: 'all .15s' }}>
                          {sel ? <CheckSquare size={12} /> : <Square size={12} />} {m.nickname || m.username}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setEditingVisibility(false)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>取消</button>
                  <Button onClick={handleUpdateVisibility}>保存</Button>
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {groupDetailLoading ? (
                <div style={{ textAlign: 'center', padding: 30 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} /></div>
              ) : groupDetail && (
                <>
                  {(groupDetail.items || []).length === 0 && !itemType ? (
                    <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>
                      <div style={{ fontSize: 14 }}>暂无内容</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>点击下方按钮添加内容</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(groupDetail.items || []).map((item: any) => {
                        const isUrl = item.mime_type === 'text/x-url'
                        const isNote = item.mime_type === 'text/x-note'
                        const isEditing = editingItem?.id === item.id
                        const canEditItem = (isUrl || isNote) && isGroupCreator(activeGroup)
                        if (isEditing) {
                          return (
                            <div key={item.id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--brand)', background: 'rgba(59,130,246,0.04)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input value={editingItem!.title} onChange={e => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : prev)} placeholder="标题"
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
                                {isUrl && <>
                                  <input value={editingItem!.url} onChange={e => setEditingItem(prev => prev ? { ...prev, url: e.target.value } : prev)} placeholder="网址"
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
                                  <input value={editingItem!.description} onChange={e => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : prev)} placeholder="备注（选填）"
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
                                </>}
                                {isNote && <textarea value={editingItem!.content} onChange={e => setEditingItem(prev => prev ? { ...prev, content: e.target.value } : prev)} placeholder="内容" rows={3}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                                <button onClick={() => setEditingItem(null)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>取消</button>
                                <Button onClick={handleUpdateItem} style={{ padding: '4px 10px', fontSize: 12 }}>保存</Button>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: isUrl ? 'pointer' : 'default' }}
                            onClick={() => { if (isUrl) window.open(ensureUrlProtocol(item.path), '_blank') }}>
                            {iconByType(item.mime_type)}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: isUrl ? 'var(--brand)' : 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.original_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isUrl ? item.path : isNote ? item.path?.substring(0, 60) : formatSize(item.size || 0)}
                              </div>
                              {isUrl && item.description && <div style={{ fontSize: 11, color: 'var(--brand)', fontStyle: 'italic' }}>{item.description}</div>}
                            </div>
                            {isUrl && <ExternalLink size={14} color="var(--brand)" />}
                            {!isUrl && !isNote && (
                              <button onClick={e => { e.stopPropagation(); window.open(`${BACKEND_URL}/api/files/${item.id}/download`, '_blank') }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand)' }}><Download size={14} /></button>
                            )}
                            {canEditItem && (
                              <button onClick={e => { e.stopPropagation(); setEditingItem({ id: item.id, title: item.original_name || '', url: item.path || '', content: item.path || '', description: item.description || '', mime_type: item.mime_type }) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 4 }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                                <Pencil size={13} />
                              </button>
                            )}
                            {(canEdit || isGroupCreator(activeGroup)) && (
                              <button onClick={e => { e.stopPropagation(); handleDeleteItem(item) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--color-danger, #ef4444)', borderRadius: 6, flexShrink: 0, opacity: 0.6 }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '1' }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.6' }}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {itemType && (
                    <div style={{ marginTop: 12, padding: 14, borderRadius: 10, border: '1px solid var(--brand)', background: 'rgba(59,130,246,0.04)' }}>
                      {itemType === 'url' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <input value={itemUrl} onChange={e => setItemUrl(e.target.value)} placeholder="https://example.com" autoFocus
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
                          <input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="名称（选填）：官网、后台"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
                          <input value={itemContent} onChange={e => setItemContent(e.target.value)} placeholder="引导/备注（选填）：点击跳转"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddGroupItem() }} />
                        </div>
                      )}
                      {itemType === 'text' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="标题（选填）" autoFocus
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
                          <textarea value={itemContent} onChange={e => setItemContent(e.target.value)} placeholder="输入文字内容..." rows={3}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                        <button onClick={() => { setItemType(''); setItemUrl(''); setItemTitle(''); setItemContent('') }}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>取消</button>
                        <Button disabled={addingItem} onClick={handleAddGroupItem}>
                          {addingItem ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={12} />}
                          添加
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {!itemType && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {isGroupCreator(activeGroup) ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <input ref={groupFileRef} type="file" multiple style={{ display: 'none' }} onChange={handleGroupFileUpload} />
                    <button onClick={() => setItemType('url')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Link2 size={13} /> 网址
                    </button>
                    <button onClick={() => setItemType('text')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <StickyNote size={13} /> 文字
                    </button>
                    <button onClick={() => groupFileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Paperclip size={13} /> 文件
                    </button>
                    <button onClick={() => { if (groupFileRef.current) { groupFileRef.current.accept = 'image/*'; groupFileRef.current.click(); setTimeout(() => { if (groupFileRef.current) groupFileRef.current.accept = '' }, 100) } }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Image size={13} /> 图片
                    </button>
                  </div>
                ) : <div />}
                {isGroupCreator(activeGroup) && (
                  <button onClick={() => {
                    setEditVisibility(activeGroup.visibility === 'selected' ? 'selected' : 'all')
                    setEditVisibleUsers(groupDetail?.visible_users?.map((u: any) => u.user_id) || [])
                    setEditingVisibility(!editingVisibility)
                  }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                    <Users size={13} /> {activeGroup.visibility === 'selected' ? '指定可见' : '全部可见'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 添加资料弹窗 (文件模式) */}
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

            {/* 类型选择按钮组 */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {addTypes.map(t => {
                  const active = modalTab === t.key
                  return (
                    <button key={t.key} onClick={() => setModalTab(t.key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: active ? `1.5px solid ${t.color}` : '1px solid var(--border-primary)', background: active ? `color-mix(in srgb, ${t.color} 8%, var(--bg-primary))` : 'var(--bg-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? t.color : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                      <t.icon size={14} /> {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 内容区 */}
            <div style={{ padding: 20, flex: 1, overflow: 'auto' }}>
              {currentAddType && currentAddType.key === 'note' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input ref={noteFileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) setNoteFiles(prev => [...prev, ...Array.from(e.target.files!)]); if (noteFileRef.current) noteFileRef.current.value = '' }} />
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>标题（选填）</label>
                    <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="笔记标题"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                      autoFocus />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>内容 / 附件</label>
                    <div onDragOver={handleNoteDragOver} onDragLeave={handleNoteDragLeave} onDrop={handleNoteDrop}
                      style={{ borderRadius: 12, border: `1px solid ${noteDragging ? 'var(--brand)' : 'var(--border-primary)'}`, background: noteDragging ? 'var(--bg-selected)' : 'var(--bg-secondary)', transition: 'all 0.15s', overflow: 'hidden' }}>
                      <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} onPaste={handleNotePaste}
                        placeholder="输入文字内容，可直接粘贴图片或拖入文件..." rows={4}
                        style={{ width: '100%', padding: '10px 12px', border: 'none', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit', background: 'transparent', color: 'var(--text-body)', lineHeight: 1.6, boxSizing: 'border-box' }} />
                      {noteFiles.length > 0 && (
                        <div style={{ padding: '6px 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid var(--border-primary)' }}>
                          {noteFiles.map((f, i) => {
                            const isImg = f.type.startsWith('image/')
                            return (
                              <div key={i} style={{ position: 'relative', display: 'inline-flex' }}>
                                {isImg ? (
                                  <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
                                    <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 12, color: 'var(--text-body)' }}>
                                    <FileText size={12} />
                                    <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                                  </div>
                                )}
                                <button onClick={() => setNoteFiles(prev => prev.filter((_, j) => j !== i))}
                                  style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
                        <button onClick={() => noteFileRef.current?.click()} title="添加文件"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Paperclip size={14} /> 文件
                        </button>
                        <button onClick={() => { if (noteFileRef.current) { noteFileRef.current.accept = 'image/*'; noteFileRef.current.click(); setTimeout(() => { if (noteFileRef.current) noteFileRef.current.accept = '' }, 100) } }} title="添加图片"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Image size={14} /> 图片
                        </button>
                        <span style={{ flex: 1 }} />
                        <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>支持拖拽 / Ctrl+V 粘贴</span>
                      </div>
                    </div>
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
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>名称（选填）</label>
                    <input value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="例如：官网、后台、文档"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 6, display: 'block' }}>引导/备注（选填）</label>
                    <input value={urlDesc} onChange={e => setUrlDesc(e.target.value)} placeholder="例如：点击跳转、需要VPN"
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
