import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  src: string
  alt?: string
  onClose: () => void
}

export default function ImageViewer({ src, alt = '预览', onClose }: Props) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pinchRef = useRef({ startDist: 0, startScale: 1 })
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 })
  const lastTapRef = useRef(0)

  const resetView = useCallback(() => { setScale(1); setTranslate({ x: 0, y: 0 }) }, [])

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
        lastTapRef.current = 0
        return
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
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div ref={containerRef}
      onClick={(e) => { if (e.target === e.currentTarget && scale <= 1.1) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, touchAction: 'none', userSelect: 'none' }}>

      <img ref={imgRef} src={src} alt={alt}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
        style={{
          maxWidth: '92vw', maxHeight: '92vh', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: dragRef.current.dragging ? 'none' : 'transform 0.15s ease-out',
          touchAction: 'none',
        }} />

      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(5, s + 0.5)) }}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        <button onClick={(e) => { e.stopPropagation(); const ns = Math.max(0.5, scale - 0.5); setScale(ns); if (ns <= 1) setTranslate({ x: 0, y: 0 }) }}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        <button onClick={(e) => { e.stopPropagation(); resetView() }}
          style={{ height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, padding: '0 14px', display: 'flex', alignItems: 'center' }}>{Math.round(scale * 100)}%</button>
      </div>

      <button onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
    </div>
  )
}
