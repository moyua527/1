import { useState, useRef, useCallback, useEffect } from 'react'
import { Download, Pencil, Grid2X2, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  src: string
  alt?: string
  onClose: () => void
  images?: string[]
  startIndex?: number
  onEdit?: (src: string) => void
}

export default function ImageViewer({ src, alt = '预览', onClose, images, startIndex = 0, onEdit }: Props) {
  const gallery = images && images.length > 1 ? images : null
  const [idx, setIdx] = useState(gallery ? startIndex : 0)
  const currentSrc = gallery ? gallery[idx] : src

  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pinchRef = useRef({ startDist: 0, startScale: 1 })
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 })
  const lastTapRef = useRef(0)

  const resetView = useCallback(() => { setScale(1); setTranslate({ x: 0, y: 0 }) }, [])

  useEffect(() => { resetView() }, [idx, resetView])

  const clampTranslate = useCallback((tx: number, ty: number, s: number) => {
    if (s <= 1) return { x: 0, y: 0 }
    const img = imgRef.current
    if (!img) return { x: tx, y: ty }
    const maxX = (img.clientWidth * (s - 1)) / 2
    const maxY = (img.clientHeight * (s - 1)) / 2
    return { x: Math.max(-maxX, Math.min(maxX, tx)), y: Math.max(-maxY, Math.min(maxY, ty)) }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setScale(prev => {
      const next = Math.max(0.5, Math.min(5, prev + delta))
      if (next <= 1) setTranslate({ x: 0, y: 0 })
      return next
    })
  }, [])

  const getTouchDist = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    if (e.touches.length === 2) {
      pinchRef.current = { startDist: getTouchDist(e.touches[0], e.touches[1]), startScale: scale }
    } else if (e.touches.length === 1) {
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        if (scale > 1.2) resetView()
        else { setScale(2.5); setTranslate({ x: 0, y: 0 }) }
        lastTapRef.current = 0; return
      }
      lastTapRef.current = now
      if (scale > 1) {
        dragRef.current = { dragging: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, startTx: translate.x, startTy: translate.y }
      }
    }
  }, [scale, translate, resetView])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    if (e.touches.length === 2) {
      const dist = getTouchDist(e.touches[0], e.touches[1])
      const newScale = Math.max(0.5, Math.min(5, pinchRef.current.startScale * (dist / pinchRef.current.startDist)))
      setScale(newScale)
      if (newScale <= 1) setTranslate({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && dragRef.current.dragging) {
      const dx = e.touches[0].clientX - dragRef.current.startX
      const dy = e.touches[0].clientY - dragRef.current.startY
      setTranslate(clampTranslate(dragRef.current.startTx + dx, dragRef.current.startTy + dy, scale))
    }
  }, [scale, clampTranslate])

  const handleTouchEnd = useCallback(() => {
    dragRef.current.dragging = false
    if (scale < 1) { setScale(1); setTranslate({ x: 0, y: 0 }) }
  }, [scale])

  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (containerRef.current?.contains(e.target as Node) && e.touches.length >= 2) e.preventDefault()
    }
    document.addEventListener('touchmove', handler, { passive: false })
    return () => document.removeEventListener('touchmove', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (gallery) {
        if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
        if (e.key === 'ArrowRight') setIdx(i => Math.min(gallery.length - 1, i + 1))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, gallery])

  const handleDownload = useCallback(() => {
    const a = document.createElement('a')
    a.href = currentSrc
    a.download = currentSrc.split('/').pop() || 'image.png'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [currentSrc])

  const tbtn = (icon: React.ReactNode, label: string, onClick: () => void, active = false) => (
    <button onClick={(e) => { e.stopPropagation(); onClick() }} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: 'none', border: 'none', cursor: 'pointer',
      color: active ? '#22c55e' : '#fff', fontSize: 10, padding: '6px 12px', opacity: active ? 1 : 0.8,
    }}>{icon}<span>{label}</span></button>
  )

  // grid view
  if (showGrid && gallery) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#fff', fontSize: 14 }}>全部图片 ({gallery.length})</span>
          <button onClick={() => setShowGrid(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {gallery.map((s, i) => (
            <img key={i} src={s} onClick={() => { setIdx(i); setShowGrid(false) }}
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: i === idx ? '2px solid #22c55e' : '2px solid transparent' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef}
      onClick={(e) => { if (e.target === e.currentTarget && scale <= 1.1) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, touchAction: 'none', userSelect: 'none' }}>

      {/* header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', zIndex: 2 }}>
        {gallery && <span style={{ color: '#fff', fontSize: 14, opacity: 0.8 }}>{idx + 1} / {gallery.length}</span>}
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>
      </div>

      {/* nav arrows */}
      {gallery && idx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx(i => i - 1) }} style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><ChevronLeft size={20} /></button>
      )}
      {gallery && idx < gallery.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx(i => i + 1) }} style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><ChevronRight size={20} /></button>
      )}

      {/* image */}
      <img ref={imgRef} src={currentSrc} alt={alt}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
        style={{
          maxWidth: '92vw', maxHeight: 'calc(100vh - 120px)', borderRadius: 4,
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: dragRef.current.dragging ? 'none' : 'transform 0.15s ease-out',
          touchAction: 'none',
        }} />

      {/* bottom toolbar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 8, padding: '10px 16px 20px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', zIndex: 2,
      }}>
        {tbtn(<Download size={20} />, '下载', handleDownload)}
        {onEdit && tbtn(<Pencil size={20} />, '编辑', () => onEdit(currentSrc))}
        {gallery && tbtn(<Grid2X2 size={20} />, '全部', () => setShowGrid(true))}
      </div>
    </div>
  )
}
