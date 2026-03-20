import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, FileText, Image, Film, FileArchive, Download } from 'lucide-react'
import { fileApi } from '../services/api'
import Button from '../../ui/Button'
import { confirm } from '../../ui/ConfirmDialog'

const iconMap: Record<string, any> = { image: Image, video: Film, zip: FileArchive }
const getIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return Image
  if (['mp4','mov','avi','mkv'].includes(ext)) return Film
  if (['zip','rar','7z','tar','gz'].includes(ext)) return FileArchive
  return FileText
}

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }

interface Props { projectId: string }

export default function FileList({ projectId }: Props) {
  const [files, setFiles] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const load = () => { fileApi.list(projectId).then(r => { if (r.success) setFiles(r.data || []) }) }
  useEffect(load, [projectId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await fileApi.upload(projectId, file)
    if (inputRef.current) inputRef.current.value = ''
    load()
  }

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: '确定删除此文件？', danger: true }))) return
    await fileApi.remove(id)
    load()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>文件列表</h3>
        <Button onClick={() => inputRef.current?.click()}><Upload size={14} /> 上传</Button>
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
      </div>
      {files.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无文件</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f: any) => {
            const Icon = getIcon(f.original_name || f.filename || '')
            return (
              <div key={f.id} style={row}
                onClick={() => { const a = document.createElement('a'); a.href = fileApi.downloadUrl(String(f.id)); a.download = f.original_name || f.filename || ''; a.click() }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}>
                <Icon size={20} color="#64748b" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#2563eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name || f.filename}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatSize(f.file_size || f.size || 0)}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(String(f.id)) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex' }} title="删除"><Trash2 size={16} /></button>
                <Download size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
