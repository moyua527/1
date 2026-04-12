import { useState, useRef, useMemo } from 'react'
import { FileText, Upload, Loader2, Trash2, Search, MoreVertical, CheckSquare, X } from 'lucide-react'
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
  const [multiSelect, setMultiSelect] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useLiveData(['file'], () => invalidate('files'))

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { '': files.length }
    for (const f of files) { const c = getCategory(f.mime_type); counts[c] = (counts[c] || 0) + 1 }
    return counts
  }, [files])

  const filtered = useMemo(() => files.filter(f => {
    if (category && getCategory(f.mime_type) !== category) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      return (f.original_name || '').toLowerCase().includes(s) || (f.project_name || '').toLowerCase().includes(s)
    }
    return true
  }), [files, category, search])

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
    let ok = 0, fail = 0
    for (let i = 0; i < fileList.length; i++) {
      const fd = new FormData()
      fd.append('file', fileList[i])
      const r = await uploadFile('/api/files/upload', fd)
      if (r.success) ok++; else fail++
    }
    setUploading(false)
    if (fail === 0) toast(`${ok}个文件上传完成`, 'success')
    else toast(`上传完成：${ok}成功，${fail}失败`, fail > 0 ? 'error' : 'success')
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
    <div style={isMobile ? { display: 'flex', flexDirection: 'column' as const, height: '100%', margin: '-20px -16px', padding: 0 } : undefined}>
      {isMobile ? (
        <div style={{ flexShrink: 0, background: 'var(--bg-secondary)', padding: '14px 16px 0' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 10px', textAlign: 'center' }}>文件管理</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件..."
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
            </div>
            <button disabled={uploading} onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Upload size={14} /> {uploading ? '上传中' : '上传'}
            </button>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setMenuOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <>
                  <div onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false) }}
                    style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 200, background: 'var(--bg-primary)', borderRadius: 10, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: '1px solid var(--border-primary)', minWidth: 120 }}>
                    <button onClick={() => { setMultiSelect(v => !v); setSelected(new Set()); setMenuOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        color: multiSelect ? 'var(--brand)' : 'var(--text-body)', background: 'transparent', borderRadius: 8 }}>
                      <CheckSquare size={15} /> {multiSelect ? '退出多选' : '多选'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, WebkitOverflowScrolling: 'touch' as any }}>
            {categoryTabs.map(t => {
              const count = categoryCounts[t.key] || 0
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
          {multiSelect && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
              <button onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <CheckSquare size={13} /> {selected.size === filtered.length && filtered.length > 0 ? '取消全选' : '全选'}
              </button>
              {selected.size > 0 && (
                <button onClick={handleBatchDelete} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--bg-danger-hover)', color: 'var(--color-danger)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  <Trash2 size={13} /> 删除 ({selected.size})
                </button>
              )}
              <button onClick={() => { setMultiSelect(false); setSelected(new Set()) }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <X size={13} /> 取消
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
        <PageHeader title="文件管理" subtitle={`共 ${files.length} 个文件 · ${formatSize(totalSize)}`}
          actions={<>
            <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}><Upload size={14} /> {uploading ? '上传中...' : '上传文件'}</Button>
          </>} />
      </>
      )}
      <input ref={fileInputRef} type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />

      <div style={isMobile ? { flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 16px 16px', WebkitOverflowScrolling: 'touch' as any } : undefined}>
      {!isMobile && (
        <FilterBar
          search={search} onSearchChange={setSearch} searchPlaceholder="搜索文件..."
          filters={[{
            value: category, onChange: (v: string) => { setCategory(v); setSelected(new Set()) },
            options: categoryTabs.map(t => ({ value: t.key, label: `${t.label}${t.key ? ` (${categoryCounts[t.key] || 0})` : ''}` })),
            placeholder: `全部 (${categoryCounts[''] || 0})`,
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
          isMobile={isMobile}
          multiSelect={multiSelect}
        />
      )}
      </div>
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
