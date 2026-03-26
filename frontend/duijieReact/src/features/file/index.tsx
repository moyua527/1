import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FileText, Download, Trash2, Search, Upload, Loader2, File, Image, FileSpreadsheet, FileCode, Film, Eye, X, CheckSquare, Square } from 'lucide-react'
import { fetchApi, uploadFile, BACKEND_URL } from '../../bootstrap'
import useLiveData from '../../hooks/useLiveData'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

const iconByType = (mime: string) => {
  if (mime?.startsWith('image/')) return <Image size={20} color="#7c3aed" />
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return <FileSpreadsheet size={20} color="#16a34a" />
  if (mime?.includes('video')) return <Film size={20} color="#dc2626" />
  if (mime?.includes('json') || mime?.includes('javascript') || mime?.includes('html') || mime?.includes('css')) return <FileCode size={20} color="#d97706" />
  return <File size={20} color="#2563eb" />
}

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
  background: active ? '#2563eb' : 'transparent', color: active ? '#fff' : '#64748b', transition: 'all 0.15s',
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

  const canPreview = (mime: string) => {
    if (!mime) return false
    return mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/') || mime.startsWith('audio/') || mime.startsWith('text/') || mime === 'application/json'
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>文件管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>共 {files.length} 个文件 · {formatSize(totalSize)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件..."
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', width: 200 }} />
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
          <button onClick={handleBatchDelete} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            <Trash2 size={14} /> 删除选中 ({selected.size})
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <FileText size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>{search || category ? '未找到匹配文件' : '暂无文件'}</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', width: 36 }}>
                    <button onClick={selectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: selected.size === filtered.length && filtered.length > 0 ? '#2563eb' : '#cbd5e1', display: 'flex' }}>
                      {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>文件名</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>项目</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>大小</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>上传者</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>日期</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: selected.has(f.id) ? '#eff6ff' : 'transparent' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => toggleSelect(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: selected.has(f.id) ? '#2563eb' : '#cbd5e1', display: 'flex' }}>
                        {selected.has(f.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {iconByType(f.mime_type)}
                        <span style={{ color: '#0f172a', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{f.project_name || '-'}</td>
                    <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatSize(f.size || 0)}</td>
                    <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{f.uploader_name || '-'}</td>
                    <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(f.created_at).toLocaleDateString('zh-CN')}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {canPreview(f.mime_type) && <button onClick={() => setPreview(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#7c3aed' }} title="预览"><Eye size={16} /></button>}
                      <button onClick={() => handleDownload(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#2563eb' }} title="下载"><Download size={16} /></button>
                      <button onClick={() => handleDelete(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#dc2626', marginLeft: 4 }} title="删除"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={() => setPreview(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90vw', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {iconByType(preview.mime_type)}
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.original_name}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatSize(preview.size || 0)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleDownload(preview)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#2563eb' }} title="下载"><Download size={18} /></button>
                <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }} title="关闭"><X size={18} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 300 }}>
              {preview.mime_type?.startsWith('image/') && (
                <img src={getPreviewUrl(preview)} alt={preview.original_name} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
              )}
              {preview.mime_type === 'application/pdf' && (
                <iframe src={getPreviewUrl(preview)} style={{ width: '100%', height: '80vh', border: 'none' }} title={preview.original_name} />
              )}
              {preview.mime_type?.startsWith('video/') && (
                <video src={getPreviewUrl(preview)} controls style={{ maxWidth: '100%', maxHeight: '80vh' }} />
              )}
              {preview.mime_type?.startsWith('audio/') && (
                <audio src={getPreviewUrl(preview)} controls style={{ margin: 40 }} />
              )}
              {(preview.mime_type?.startsWith('text/') || preview.mime_type === 'application/json') && (
                <iframe src={getPreviewUrl(preview)} style={{ width: '100%', height: '80vh', border: 'none', background: '#fff' }} title={preview.original_name} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
