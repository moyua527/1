import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'

interface Props {
  files: File[]
  onConfirm: (files: File[], useOriginal: boolean) => void
  onEdit: (file: File, index: number) => void
  onCancel: () => void
}

export default function ImageUploadPreview({ files, onConfirm, onEdit, onCancel }: Props) {
  const [idx, setIdx] = useState(0)
  const [useOriginal, setUseOriginal] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    const newUrls = files.map(f => URL.createObjectURL(f))
    setUrls(newUrls)
    return () => newUrls.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx(i => Math.min(files.length - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel, files.length])

  const handleConfirm = useCallback(() => {
    onConfirm(files, useOriginal)
  }, [files, useOriginal, onConfirm])

  const currentFile = files[idx]
  const currentUrl = urls[idx]
  if (!currentFile || !currentUrl) return null

  const fileSizeKB = Math.round(currentFile.size / 1024)
  const totalSizeKB = files.reduce((s, f) => s + f.size, 0)
  const totalSizeMB = (totalSizeKB / 1024 / 1024).toFixed(1)

  return (
    <div ref={containerRef}
      style={{ position: 'fixed', inset: 0, background: '#111', zIndex: 9999, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', flexShrink: 0 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.9 }}>
          <ChevronLeft size={18} /> 取消
        </button>
        {files.length > 1 && (
          <span style={{ color: '#fff', fontSize: 14, opacity: 0.7 }}>{idx + 1} / {files.length}</span>
        )}
        <div style={{ width: 60 }} />
      </div>

      {/* image preview area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', padding: 12 }}>
        <img
          src={currentUrl}
          alt={currentFile.name}
          draggable={false}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4, userSelect: 'none' }}
        />

        {files.length > 1 && idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)} style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ChevronLeft size={20} /></button>
        )}
        {files.length > 1 && idx < files.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ChevronRight size={20} /></button>
        )}
      </div>

      {/* thumbnail strip */}
      {files.length > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '6px 16px', flexShrink: 0 }}>
          {files.map((f, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: 48, height: 48, borderRadius: 6, overflow: 'hidden', border: i === idx ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', padding: 0, background: 'none', flexShrink: 0,
            }}>
              <img src={urls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      {/* bottom toolbar - WeChat style */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px 20px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Edit button */}
        <button onClick={() => onEdit(currentFile, idx)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: '#fff', fontSize: 14, cursor: 'pointer', padding: '8px 4px', opacity: 0.9,
        }}>
          <Pencil size={16} /> 编辑
        </button>

        {/* Original toggle */}
        <button onClick={() => setUseOriginal(!useOriginal)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: '#fff', fontSize: 14, cursor: 'pointer', padding: '8px 4px',
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: useOriginal ? 'none' : '1.5px solid rgba(255,255,255,0.5)',
            background: useOriginal ? '#22c55e' : 'transparent', transition: 'all 0.15s',
            fontSize: 11, color: '#fff', fontWeight: 600,
          }}>
            {useOriginal && '✓'}
          </span>
          原图{useOriginal && ` (${files.length > 1 ? totalSizeMB + 'MB' : fileSizeKB > 1024 ? (fileSizeKB / 1024).toFixed(1) + 'MB' : fileSizeKB + 'KB'})`}
        </button>

        {/* Send button */}
        <button onClick={handleConfirm} style={{
          padding: '8px 24px', borderRadius: 6, background: '#22c55e', border: 'none',
          cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600, minWidth: 80,
        }}>
          确定{files.length > 1 ? ` (${files.length})` : ''}
        </button>
      </div>
    </div>
  )
}
