import { useState, useRef, useEffect, useCallback } from 'react'
import { Pen, Type, Crop, Grid3X3, RotateCcw, Check, X } from 'lucide-react'

interface Props {
  imageFile?: File
  imageSrc?: string
  onConfirm: (editedFile: File) => void
  onCancel: () => void
}

type Tool = 'draw' | 'text' | 'crop' | 'mosaic'

const COLORS = ['#ef4444', '#3b82f6', '#000000', '#22c55e', '#eab308', '#ffffff']
const SIZES = [2, 4, 8]
const MOSAIC_BLOCK = 12
const MAX_DIM = 2048

export default function ImageEditor({ imageFile, imageSrc, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('draw')
  const [color, setColor] = useState('#ef4444')
  const [lineWidth, setLineWidth] = useState(4)
  const [history, setHistory] = useState<ImageData[]>([])
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const drawingRef = useRef(false)
  const scaleRatio = useRef(1)
  const rafId = useRef(0)
  const toolRef = useRef<Tool>('draw')
  const colorRef = useRef('#ef4444')
  const lineWidthRef = useRef(4)
  const pointsBuffer = useRef<{ x: number; y: number }[]>([])

  toolRef.current = tool
  colorRef.current = color
  lineWidthRef.current = lineWidth

  const [textInput, setTextInput] = useState('')
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null)
  const [textSize, setTextSize] = useState(20)

  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [cropDragging, setCropDragging] = useState<string | null>(null)
  const cropStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0, ow: 0, oh: 0 })

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      const capScale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1)
      canvas.width = Math.round(img.width * capScale)
      canvas.height = Math.round(img.height * capScale)
      const displayMaxW = Math.min(window.innerWidth - 24, 800)
      const displayMaxH = Math.min(window.innerHeight - 180, 600)
      const displayScale = Math.min(displayMaxW / canvas.width, displayMaxH / canvas.height, 1)
      scaleRatio.current = 1 / displayScale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)])
      setImgLoaded(true)
    }
    if (imageFile) {
      img.src = URL.createObjectURL(imageFile)
      return () => URL.revokeObjectURL(img.src)
    } else if (imageSrc) {
      img.src = imageSrc
    }
  }, [imageFile, imageSrc])

  const getNativePos = useCallback((e: TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: ((e as MouseEvent).clientX - rect.left) * scaleX, y: ((e as MouseEvent).clientY - rect.top) * scaleY }
  }, [])

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }, [])

  const saveState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }, [])

  const flushDraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pts = pointsBuffer.current
    if (pts.length < 2) return

    if (toolRef.current === 'draw') {
      ctx.beginPath()
      ctx.strokeStyle = colorRef.current
      ctx.lineWidth = lineWidthRef.current * scaleRatio.current
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(pts[0].x, pts[0].y)
      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y)
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2
          const my = (pts[i].y + pts[i + 1].y) / 2
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      }
      ctx.stroke()
    } else if (toolRef.current === 'mosaic') {
      const bs = Math.round(MOSAIC_BLOCK * scaleRatio.current)
      const r = Math.round(20 * scaleRatio.current)
      const pos = pts[pts.length - 1]
      const cx = Math.floor(pos.x), cy = Math.floor(pos.y)
      for (let bx = cx - r; bx < cx + r; bx += bs) {
        for (let by = cy - r; by < cy + r; by += bs) {
          if (bx < 0 || by < 0 || bx >= canvas.width || by >= canvas.height) continue
          const w = Math.min(bs, canvas.width - bx), h = Math.min(bs, canvas.height - by)
          const imgData = ctx.getImageData(bx, by, w, h)
          let tr = 0, tg = 0, tb = 0, cnt = 0
          for (let i = 0; i < imgData.data.length; i += 4) {
            tr += imgData.data[i]; tg += imgData.data[i + 1]; tb += imgData.data[i + 2]; cnt++
          }
          if (cnt > 0) {
            ctx.fillStyle = `rgb(${Math.round(tr / cnt)},${Math.round(tg / cnt)},${Math.round(tb / cnt)})`
            ctx.fillRect(bx, by, w, h)
          }
        }
      }
    }
    pointsBuffer.current = [pts[pts.length - 1]]
    rafId.current = 0
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onStart = (e: TouchEvent | MouseEvent) => {
      if (toolRef.current !== 'draw' && toolRef.current !== 'mosaic') return
      e.preventDefault()
      drawingRef.current = true
      const pos = getNativePos(e)
      lastPos.current = pos
      pointsBuffer.current = [pos]
    }
    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!drawingRef.current || !lastPos.current) return
      e.preventDefault()
      const pos = getNativePos(e)
      pointsBuffer.current.push(pos)
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(flushDraw)
      }
    }
    const onEnd = () => {
      if (!drawingRef.current) return
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = 0
        flushDraw()
      }
      drawingRef.current = false
      lastPos.current = null
      pointsBuffer.current = []
      const ctx = canvas.getContext('2d')
      if (ctx) {
        setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)])
      }
    }

    canvas.addEventListener('touchstart', onStart, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onEnd)
    canvas.addEventListener('mousedown', onStart)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onEnd)
    canvas.addEventListener('mouseleave', onEnd)

    return () => {
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onEnd)
      canvas.removeEventListener('mousedown', onStart)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onEnd)
      canvas.removeEventListener('mouseleave', onEnd)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [imgLoaded, getNativePos, flushDraw])

  // === Text tool ===
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (tool !== 'text') return
    const pos = getPos(e)
    setTextPos(pos)
    setTextInput('')
  }, [tool, getPos])

  const confirmText = useCallback(() => {
    if (!textPos || !textInput.trim()) { setTextPos(null); return }
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.font = `${Math.round(textSize * scaleRatio.current)}px sans-serif`
    ctx.fillStyle = color
    ctx.textBaseline = 'top'
    ctx.fillText(textInput, textPos.x, textPos.y)
    setTextPos(null)
    setTextInput('')
    saveState()
  }, [textPos, textInput, textSize, color, saveState])

  // === Crop tool ===
  const initCrop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const margin = 0.15
    setCropRect({
      x: canvas.width * margin, y: canvas.height * margin,
      w: canvas.width * (1 - margin * 2), h: canvas.height * (1 - margin * 2),
    })
  }, [])

  useEffect(() => {
    if (tool === 'crop' && !cropRect) initCrop()
    if (tool !== 'crop') setCropRect(null)
  }, [tool, cropRect, initCrop])

  const getCropHandle = useCallback((pos: { x: number; y: number }) => {
    if (!cropRect) return null
    const t = 14 * scaleRatio.current
    const { x, y, w, h } = cropRect
    if (Math.abs(pos.x - x) < t && Math.abs(pos.y - y) < t) return 'tl'
    if (Math.abs(pos.x - (x + w)) < t && Math.abs(pos.y - y) < t) return 'tr'
    if (Math.abs(pos.x - x) < t && Math.abs(pos.y - (y + h)) < t) return 'bl'
    if (Math.abs(pos.x - (x + w)) < t && Math.abs(pos.y - (y + h)) < t) return 'br'
    if (pos.x > x && pos.x < x + w && pos.y > y && pos.y < y + h) return 'move'
    return null
  }, [cropRect])

  const cropDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (tool !== 'crop' || !cropRect) return
    e.preventDefault()
    const pos = getPos(e)
    const handle = getCropHandle(pos)
    if (!handle) return
    setCropDragging(handle)
    cropStart.current = { mx: pos.x, my: pos.y, ox: cropRect.x, oy: cropRect.y, ow: cropRect.w, oh: cropRect.h }
  }, [tool, cropRect, getPos, getCropHandle])

  const cropMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!cropDragging || !cropRect || !canvasRef.current) return
    e.preventDefault()
    const pos = getPos(e)
    const dx = pos.x - cropStart.current.mx
    const dy = pos.y - cropStart.current.my
    const { ox, oy, ow, oh } = cropStart.current
    const cw = canvasRef.current.width, ch = canvasRef.current.height
    let nx = cropRect.x, ny = cropRect.y, nw = cropRect.w, nh = cropRect.h

    if (cropDragging === 'move') {
      nx = Math.max(0, Math.min(cw - ow, ox + dx)); ny = Math.max(0, Math.min(ch - oh, oy + dy)); nw = ow; nh = oh
    } else {
      if (cropDragging.includes('l')) { nx = Math.max(0, Math.min(ox + ow - 30, ox + dx)); nw = ow - (nx - ox) }
      if (cropDragging.includes('r')) { nw = Math.max(30, Math.min(cw - ox, ow + dx)) }
      if (cropDragging.includes('t')) { ny = Math.max(0, Math.min(oy + oh - 30, oy + dy)); nh = oh - (ny - oy) }
      if (cropDragging.includes('b')) { nh = Math.max(30, Math.min(ch - oy, oh + dy)) }
    }
    setCropRect({ x: nx, y: ny, w: nw, h: nh })
  }, [cropDragging, cropRect, getPos])

  const cropUp = useCallback(() => { setCropDragging(null) }, [])

  const applyCrop = useCallback(() => {
    if (!cropRect || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const { x, y, w, h } = cropRect
    const data = ctx.getImageData(x, y, w, h)
    canvas.width = w; canvas.height = h
    ctx.putImageData(data, 0, 0)
    setCropRect(null)
    setTool('draw')
    saveState()
  }, [cropRect, saveState])

  // === Undo ===
  const undo = useCallback(() => {
    if (history.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const newH = history.slice(0, -1)
    const last = newH[newH.length - 1]
    canvas.width = last.width; canvas.height = last.height
    ctx.putImageData(last, 0, 0)
    setHistory(newH)
  }, [history])

  // === Confirm ===
  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const name = imageFile ? imageFile.name.replace(/\.[^.]+$/, '') + '_edited.jpg' : 'edited.jpg'
      onConfirm(new File([blob], name, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }, [imageFile, onConfirm])

  useEffect(() => {
    const handler = (e: TouchEvent) => {
      const el = e.target as Node
      if (canvasRef.current?.contains(el)) return
      const editorRoot = canvasRef.current?.closest('[data-image-editor]')
      if (editorRoot?.contains(el)) e.preventDefault()
    }
    document.addEventListener('touchmove', handler, { passive: false })
    return () => document.removeEventListener('touchmove', handler)
  }, [])

  const isActive = (t: Tool) => tool === t
  const toolBtn = (t: Tool, icon: React.ReactNode, label: string) => (
    <button key={t} onClick={() => { setTool(t); setTextPos(null) }} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: 'none', border: 'none', cursor: 'pointer',
      color: isActive(t) ? '#22c55e' : '#fff', fontSize: 11, padding: '4px 10px',
      opacity: isActive(t) ? 1 : 0.7,
    }}>
      {icon}<span>{label}</span>
    </button>
  )

  const canvasHandlers = tool === 'crop' ? {
    onMouseDown: cropDown, onMouseMove: cropMove, onMouseUp: cropUp,
    onTouchStart: cropDown, onTouchMove: cropMove, onTouchEnd: cropUp,
  } : {
    onClick: handleCanvasClick,
  }

  const canvasRect = canvasRef.current?.getBoundingClientRect()

  return (
    <div data-image-editor style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', flexShrink: 0 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <X size={18} /> 取消
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={undo} disabled={history.length <= 1} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', opacity: history.length <= 1 ? 0.3 : 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <RotateCcw size={16} /> 撤销
          </button>
        </div>
      </div>

      {/* tool options */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '4px 12px', flexWrap: 'wrap', flexShrink: 0 }}>
        {(tool === 'draw' || tool === 'text') && <>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: color === c ? 28 : 24, height: color === c ? 28 : 24, borderRadius: '50%', background: c,
              border: color === c ? '3px solid #22c55e' : '1.5px solid rgba(255,255,255,0.3)',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: color === c ? '0 0 0 2px rgba(34,197,94,0.4)' : 'none',
            }} />
          ))}
        </>}
        {tool === 'draw' && <>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
          {SIZES.map(s => (
            <button key={s} onClick={() => setLineWidth(s)} style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: lineWidth === s ? 'rgba(34,197,94,0.25)' : 'transparent',
              border: lineWidth === s ? '2px solid #22c55e' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <span style={{ width: s * 2 + 2, height: s * 2 + 2, borderRadius: '50%', background: lineWidth === s ? '#22c55e' : color }} />
            </button>
          ))}
        </>}
        {tool === 'text' && <>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
          {[16, 20, 28, 36].map(s => (
            <button key={s} onClick={() => setTextSize(s)} style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer',
              background: textSize === s ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none',
            }}>{s}px</button>
          ))}
        </>}
        {tool === 'crop' && cropRect && (
          <button onClick={applyCrop} style={{
            padding: '6px 16px', borderRadius: 6, background: '#22c55e', color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}>确认裁剪</button>
        )}
      </div>

      {/* canvas area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'relative' }} {...canvasHandlers}>
          <canvas ref={canvasRef} style={{
            borderRadius: 4, maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 180px)',
            cursor: tool === 'crop' ? 'crosshair' : tool === 'text' ? 'text' : 'crosshair',
            touchAction: 'none', display: imgLoaded ? 'block' : 'none',
          }} />
          {!imgLoaded && <div style={{ color: '#fff', fontSize: 14 }}>加载中...</div>}

          {/* crop overlay */}
          {tool === 'crop' && cropRect && canvasRect && (() => {
            const sx = canvasRect.width / (canvasRef.current?.width || 1)
            const sy = canvasRect.height / (canvasRef.current?.height || 1)
            const rx = cropRect.x * sx, ry = cropRect.y * sy, rw = cropRect.w * sx, rh = cropRect.h * sy
            return (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ry, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'absolute', top: ry + rh, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'absolute', top: ry, left: 0, width: rx, height: rh, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'absolute', top: ry, left: rx + rw, right: 0, height: rh, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'absolute', top: ry, left: rx, width: rw, height: rh, border: '2px solid #fff' }}>
                  {['tl', 'tr', 'bl', 'br'].map(h => (
                    <div key={h} style={{
                      position: 'absolute', width: 16, height: 16, background: '#fff', borderRadius: 2,
                      ...(h.includes('t') ? { top: -6 } : { bottom: -6 }),
                      ...(h.includes('l') ? { left: -6 } : { right: -6 }),
                      pointerEvents: 'auto', cursor: h === 'tl' || h === 'br' ? 'nwse-resize' : 'nesw-resize',
                    }} />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* text input overlay */}
        {tool === 'text' && textPos && canvasRect && (
          <div style={{
            position: 'absolute',
            left: canvasRect.left + textPos.x * (canvasRect.width / (canvasRef.current?.width || 1)) - canvasRect.left,
            top: canvasRect.top + textPos.y * (canvasRect.height / (canvasRef.current?.height || 1)) - canvasRect.top,
            display: 'flex', gap: 4, zIndex: 10,
          }} onClick={(e) => e.stopPropagation()}>
            <input autoFocus value={textInput} onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmText() }}
              placeholder="输入文字..." style={{
                padding: '4px 8px', borderRadius: 4, border: '1px solid #22c55e', background: 'rgba(0,0,0,0.7)',
                color: color, fontSize: textSize * 0.6, outline: 'none', minWidth: 120,
              }} />
            <button onClick={confirmText} style={{
              padding: '4px 10px', borderRadius: 4, background: '#22c55e', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 12,
            }}>确定</button>
          </div>
        )}
      </div>

      {/* bottom toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {toolBtn('draw', <Pen size={20} />, '绘画')}
          {toolBtn('text', <Type size={20} />, '文字')}
          {toolBtn('crop', <Crop size={20} />, '裁剪')}
          {toolBtn('mosaic', <Grid3X3 size={20} />, '马赛克')}
        </div>
        <button onClick={handleConfirm} style={{
          padding: '8px 20px', borderRadius: 6, background: '#22c55e', border: 'none',
          cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Check size={16} /> 完成
        </button>
      </div>
    </div>
  )
}
