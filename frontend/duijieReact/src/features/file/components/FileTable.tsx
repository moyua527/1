import { Download, Trash2, Eye, CheckSquare, Square, File, Image, FileSpreadsheet, FileCode, Film } from 'lucide-react'

const iconByType = (mime: string) => {
  if (mime?.startsWith('image/')) return <Image size={20} color="var(--color-purple)" />
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return <FileSpreadsheet size={20} color="var(--color-success)" />
  if (mime?.includes('video')) return <Film size={20} color="var(--color-danger)" />
  if (mime?.includes('json') || mime?.includes('javascript') || mime?.includes('html') || mime?.includes('css')) return <FileCode size={20} color="var(--color-warning)" />
  return <File size={20} color="var(--brand)" />
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const canPreview = (mime: string) => {
  if (!mime) return false
  return mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/') || mime.startsWith('audio/') || mime.startsWith('text/') || mime === 'application/json'
}

interface FileTableProps {
  files: any[]
  selected: Set<number>
  onToggleSelect: (id: number) => void
  onSelectAll: () => void
  onPreview: (f: any) => void
  onDownload: (f: any) => void
  onDelete: (f: any) => void
}

export default function FileTable({ files, selected, onToggleSelect, onSelectAll, onPreview, onDownload, onDelete }: FileTableProps) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
              <th style={{ padding: '10px 12px', width: 36 }}>
                <button onClick={onSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: selected.size === files.length && files.length > 0 ? 'var(--brand)' : 'var(--text-tertiary)', display: 'flex' }}>
                  {selected.size === files.length && files.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>文件名</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>项目</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>大小</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>上传者</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>日期</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid var(--border-secondary)', background: selected.has(f.id) ? 'var(--bg-selected)' : 'transparent' }}>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => onToggleSelect(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: selected.has(f.id) ? 'var(--brand)' : 'var(--text-tertiary)', display: 'flex' }}>
                    {selected.has(f.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {iconByType(f.mime_type)}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{f.project_name || '-'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatSize(f.size || 0)}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{f.uploader_name || '-'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(f.created_at).toLocaleDateString('zh-CN')}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {canPreview(f.mime_type) && <button onClick={() => onPreview(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-purple)' }} title="预览"><Eye size={16} /></button>}
                  <button onClick={() => onDownload(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand)' }} title="下载"><Download size={16} /></button>
                  <button onClick={() => onDelete(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-danger)', marginLeft: 4 }} title="删除"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
