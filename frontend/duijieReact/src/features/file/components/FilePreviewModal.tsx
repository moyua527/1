import { Download, X, File, Image, FileSpreadsheet, FileCode, Film } from 'lucide-react'

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

interface FilePreviewModalProps {
  file: any
  previewUrl: string
  onDownload: (f: any) => void
  onClose: () => void
}

export default function FilePreviewModal({ file, previewUrl, onDownload, onClose }: FilePreviewModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '90vw', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {iconByType(file.mime_type)}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.original_name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatSize(file.size || 0)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onDownload(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--brand)' }} title="下载"><Download size={18} /></button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }} title="关闭"><X size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', minHeight: 300 }}>
          {file.mime_type?.startsWith('image/') && (
            <img src={previewUrl} alt={file.original_name} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
          {file.mime_type === 'application/pdf' && (
            <iframe src={previewUrl} style={{ width: '100%', height: '80vh', border: 'none' }} title={file.original_name} sandbox="" />
          )}
          {file.mime_type?.startsWith('video/') && (
            <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '80vh' }} />
          )}
          {file.mime_type?.startsWith('audio/') && (
            <audio src={previewUrl} controls style={{ margin: 40 }} />
          )}
          {(file.mime_type?.startsWith('text/') || file.mime_type === 'application/json') && (
            <iframe src={previewUrl} style={{ width: '100%', height: '80vh', border: 'none', background: 'var(--bg-card)' }} title={file.original_name} sandbox="" />
          )}
        </div>
      </div>
    </div>
  )
}
