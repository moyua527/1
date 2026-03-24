import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FileText, Download, Trash2, Search, Upload, Loader2, File, Image, FileSpreadsheet, FileCode, Film, Eye, X } from 'lucide-react'
import { fetchApi, uploadFile, BACKEND_URL } from '../../bootstrap'
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

export default function FileManager() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const load = () => {
    setLoading(true)
    fetchApi('/api/files/all').then(r => { if (r.success) setFiles(r.data || []) }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = search.trim()
    ? files.filter(f => (f.original_name || '').toLowerCase().includes(search.toLowerCase()) || (f.project_name || '').toLowerCase().includes(search.toLowerCase()))
    : files

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const r = await uploadFile('/api/files/upload', fd)
    setUploading(false)
    if (r.success) { toast('文件上传成功', 'success'); load() }
    else toast(r.message || '上传失败', 'error')
    e.target.value = ''
  }

  const handleDelete = async (f: any) => {
    if (!(await confirm({ message: `确定删除文件"${f.original_name}"？`, danger: true }))) return
    const r = await fetchApi(`/api/files/${f.id}`, { method: 'DELETE' })
    if (r.success) { toast('文件已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>文件管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>所有项目文件 · 共 {files.length} 个</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件..."
              style={{ paddingLeft: 32, padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', width: 200 }} />
          </div>
          <label style={{ display: 'inline-flex' }}>
            <Button disabled={uploading}><Upload size={14} /> {uploading ? '上传中...' : '上传文件'}</Button>
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <FileText size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>{search ? '未找到匹配文件' : '暂无文件'}</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
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
                  <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
