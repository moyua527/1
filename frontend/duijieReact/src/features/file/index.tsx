import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FileText, Search, Upload, Loader2, Trash2 } from 'lucide-react'
import { fetchApi, uploadFile, BACKEND_URL } from '../../bootstrap'
import useLiveData from '../../hooks/useLiveData'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import FileTable from './components/FileTable'
import FilePreviewModal from './components/FilePreviewModal'

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getCategory = (mime: string) => {
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
  { key: 'sheet', label: '表格' },
  { key: 'media', label: '音视频' },
  { key: 'other', label: '其他' },
]
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  background: active ? 'var(--brand)' : 'transparent', color: active ? 'var(--bg-primary)' : 'var(--text-secondary)', transition: 'all 0.15s',
})

export default function FileManager() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    fetchApi('/api/files/all').then(r => { if (r.success) setFiles(r.data || []) }).finally(() => setLoading(false))
  }
  useEffect(load, [])
  useLiveData(['file'], load)

  const filtered = files.filter(f => {
    if (category && getCategory(f.mime_type) !== category) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      return (f.original_name || '').toLowerCase().includes(s) || (f.project_name || '').toLowerCase().includes(s)
    }
    return true
  })

  const toggleSelect = (id: number) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(f => f.id)))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    for (let i = 0; i < fileList.length; i++) {
      const fd = new FormData()
      fd.append('file', fileList[i])
      await uploadFile('/api/files/upload', fd)
    }
    setUploading(false)
    toast(`${fileList.length}个文件上传完成`, 'success')
    load()
    e.target.value = ''
  }

  const handleDelete = async (f: any) => {
    if (!(await confirm({ message: `确定删除文件"${f.original_name}"？`, danger: true }))) return
    const r = await fetchApi(`/api/files/${f.id}`, { method: 'DELETE' })
    if (r.success) { toast('文件已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleBatchDelete = async () => {
    if (selected.size === 0) return
    if (!(await confirm({ message: `确定删除选中的 ${selected.size} 个文件？`, danger: true }))) return
    let ok = 0
    for (const id of selected) {
      const r = await fetchApi(`/api/files/${id}`, { method: 'DELETE' })
      if (r.success) ok++
    }
    toast(`已删除 ${ok} 个文件`, 'success')
    setSelected(new Set())
    load()
  }

  const handleDownload = (f: any) => {
    window.open(`${BACKEND_URL}/api/files/${f.id}/download`, '_blank')
  }

  const getPreviewUrl = (f: any) => {
    const token = sessionStorage.getItem('token')
    return `${BACKEND_URL}/api/files/${f.id}/preview?token=${token}`
  }

  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>文件管理</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>共 {files.length} 个文件 · {formatSize(totalSize)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件..."
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', width: 200 }} />
          </div>
          <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}><Upload size={14} /> {uploading ? '上传中...' : '上传文件'}</Button>
          <input ref={fileInputRef} type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />
        </div>
      </div>

      {/* 分类Tab */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {categoryTabs.map(t => {
          const cnt = t.key ? files.filter(f => getCategory(f.mime_type) === t.key).length : files.length
          return (
            <button key={t.key} onClick={() => { setCategory(t.key); setSelected(new Set()) }} style={tabStyle(category === t.key)}>
              {t.label} {cnt > 0 && <span style={{ opacity: 0.7, marginLeft: 2 }}>({cnt})</span>}
            </button>
          )
        })}
        {selected.size > 0 && (
          <button onClick={handleBatchDelete} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            <Trash2 size={14} /> 删除选中 ({selected.size})
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}>
          <FileText size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>{search || category ? '未找到匹配文件' : '暂无文件'}</div>
        </div>
      ) : (
        <FileTable
          files={filtered}
          selected={selected}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onPreview={setPreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
      {preview && (
        <FilePreviewModal
          file={preview}
          previewUrl={getPreviewUrl(preview)}
          onDownload={handleDownload}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
