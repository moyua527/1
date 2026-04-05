import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  imageFile: File
  onConfirm: (editedFile: File) => void
  onCancel: () => void
}

const COLORS = ['#ef4444', '#3b82f6', '#000000', '#22c55e', '#eab308', '#ffffff']
const SIZES = [2, 4, 8]

export default function ImageEditor({ imageFile, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [color, setColor] = useState('#ef4444')
  const [lineWidth, setLineWidth] = useState(4)
  const [history, setHistory] = useState<ImageData[]>([])
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      const maxW = Math.min(window.innerWidth - 32, 800)
      const maxH = Math.min(window.innerHeight - 200, 600)
      const scale = Math.min(maxW / img.width, maxH / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)])
      setImgLoaded(true)
    }
    img.src = URL.createObjectURL(imageFile)
    return () => URL.revokeObjectURL(img.src)
  }, [imageFile])

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

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDrawing(true)
    lastPos.current = getPos(e)
  }, [getPos])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !lastPos.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }, [drawing, color, lineWidth, getPos])

  const endDraw = useCallback(() => {
    if (!drawing) return
    setDrawing(false)
    lastPos.current = null
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }, [drawing])

  const undo = useCallback(() => {
    if (history.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const newHistory = history.slice(0, -1)
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0)
    setHistory(newHistory)
  }, [history])

  const reset = useCallback(() => {
    if (history.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(history[0], 0, 0)
    setHistory([history[0]])
  }, [history])

  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const ext = imageFile.name.split('.').pop() || 'png'
      const name = imageFile.name.replace(/\.[^.]+$/, '') + '_edited.' + ext
      const file = new File([blob], name, { type: blob.type })
      onConfirm(file)
    }, imageFile.type || 'image/png', 0.92)
  }, [imageFile, onConfirm])

  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (canvasRef.current?.contains(e.target as Node)) e.preventDefault()
    }
    document.addEventListener('touchmove', handler, { passive: false })
    return () => document.removeEventListener('touchmove', handler)
  }, [])

  const toolBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 8, border: active ? '2px solid var(--brand)' : '1px solid var(--border-primary)',
    background: active ? 'var(--bg-selected)' : 'var(--bg-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 4,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
      {/* toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px' }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{
            width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--brand)' : '2px solid rgba(255,255,255,0.3)',
            cursor: 'pointer', boxShadow: color === c ? '0 0 0 2px var(--bg-primary)' : 'none',
          }} />
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
        {SIZES.map(s => (
          <button key={s} onClick={() => setLineWidth(s)} style={toolBtnStyle(lineWidth === s)}>
            <span style={{ width: s * 2, height: s * 2, borderRadius: '50%', background: color }} />
          </button>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
        <button onClick={undo} disabled={history.length <= 1} style={{ ...toolBtnStyle(false), opacity: history.length <= 1 ? 0.4 : 1, color: '#fff' }}>↩ 撤销</button>
        <button onClick={reset} disabled={history.length <= 1} style={{ ...toolBtnStyle(false), opacity: history.length <= 1 ? 0.4 : 1, color: '#fff' }}>🔄 重置</button>
      </div>

      {/* canvas */}
      <div style={{ position: 'relative', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 200px)' }}>
        <canvas ref={canvasRef}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          style={{ borderRadius: 8, cursor: 'crosshair', maxWidth: '100%', maxHeight: '100%', touchAction: 'none', display: imgLoaded ? 'block' : 'none' }} />
        {!imgLoaded && <div style={{ color: '#fff', fontSize: 14 }}>加载中...</div>}
      </div>

      {/* action buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button onClick={onCancel} style={{ padding: '10px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 500 }}>取消</button>
        <button onClick={handleConfirm} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--brand)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 500 }}>确认上传</button>
      </div>
    </div>
  )
}
