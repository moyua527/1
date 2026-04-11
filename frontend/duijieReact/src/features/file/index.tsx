import { useState, useRef } from 'react'
import { FileText, Upload, Loader2, Trash2, Search } from 'lucide-react'
import { fetchApi, uploadFile, BACKEND_URL } from '../../bootstrap'
import { useFiles, useInvalidate } from '../../hooks/useApi'
import useLiveData from '../../hooks/useLiveData'
import useIsMobile from '../ui/useIsMobile'
import Button from '../ui/Button'
import PageHeader from '../ui/PageHeader'
import FilterBar from '../ui/FilterBar'
import EmptyState from '../ui/EmptyState'
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

export default function FileManager() {
  const { data: files = [], isLoading: loading } = useFiles()
  const invalidate = useInvalidate()
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useLiveData(['file'], () => invalidate('files'))

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
    invalidate('files')
    e.target.value = ''
  }

  const handleDelete = async (f: any) => {
    if (!(await confirm({ message: `确定删除文件"${f.original_name}"？`, danger: true }))) return
    const r = await fetchApi(`/api/files/${f.id}`, { method: 'DELETE' })
    if (r.success) { toast('文件已删除', 'success'); invalidate('files') }
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
    invalidate('files')
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
      <PageHeader title="文件管理" subtitle={`共 ${files.length} 个文件 · ${formatSize(totalSize)}`}
        actions={isMobile ? undefined : <>
          <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}><Upload size={14} /> {uploading ? '上传中...' : '上传文件'}</Button>
        </>} />
      <input ref={fileInputRef} type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />

      {isMobile ? (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 0 10px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件..."
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
            </div>
            <button disabled={uploading} onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Upload size={14} /> {uploading ? '上传中...' : '上传'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, WebkitOverflowScrolling: 'touch' as any }}>
            {categoryTabs.map(t => {
              const count = t.key ? files.filter(f => getCategory(f.mime_type) === t.key).length : files.length
              const active = category === t.key
              return (
                <button key={t.key} onClick={() => { setCategory(t.key); setSelected(new Set()) }}
                  style={{
                    padding: '5px 12px', borderRadius: 16, border: active ? '1px solid var(--brand)' : '1px solid var(--border-primary)',
                    background: active ? 'var(--brand-light-2)' : 'var(--bg-primary)', color: active ? 'var(--brand)' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {t.label} ({count})
                </button>
              )
            })}
          </div>
          {selected.size > 0 && (
            <div style={{ paddingBottom: 8 }}>
              <button onClick={handleBatchDelete} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--bg-danger-hover)', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                <Trash2 size={14} /> 删除选中 ({selected.size})
              </button>
            </div>
          )}
        </>
      ) : (
        <FilterBar
          search={search} onSearchChange={setSearch} searchPlaceholder="搜索文件..."
          filters={[{
            value: category, onChange: (v: string) => { setCategory(v); setSelected(new Set()) },
            options: categoryTabs.map(t => ({ value: t.key, label: `${t.label}${t.key ? ` (${files.filter(f => getCategory(f.mime_type) === t.key).length})` : ''}` })),
            placeholder: `全部 (${files.length})`,
          }]}
          resultCount={filtered.length}
          hasFilters={!!(search.trim() || category)} activeFilterCount={(search.trim() ? 1 : 0) + (category ? 1 : 0)}
          onClearFilters={() => { setSearch(''); setCategory(''); setSelected(new Set()) }}
          extra={selected.size > 0 ? (
            <button onClick={handleBatchDelete} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--bg-danger-hover)', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              <Trash2 size={14} /> 删除选中 ({selected.size})
            </button>
          ) : undefined}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title={search || category ? '未找到匹配文件' : '暂无文件'} subtitle={search || category ? undefined : '上传文件开始管理'} />
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
