import { useState, useEffect, useRef } from 'react'
import { isCapacitor } from '../../utils/capacitor'

const SIZE = 260
const DOT_GAP = SIZE / 3
const DOT_R = 14

function hashPattern(pattern: number[]): string {
  const str = pattern.join('-')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return 'g_' + Math.abs(hash).toString(36)
}

function PatternGrid({ onComplete, error }: { onComplete: (p: number[]) => void; error: boolean }) {
  const [selected, setSelected] = useState<number[]>([])
  const [drawing, setDrawing] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const dots = Array.from({ length: 9 }, (_, i) => ({
    idx: i,
    cx: (i % 3) * DOT_GAP + DOT_GAP / 2,
    cy: Math.floor(i / 3) * DOT_GAP + DOT_GAP / 2,
  }))

  const getTouch = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return null
    const t = 'touches' in e ? e.touches[0] || e.changedTouches[0] : e
    return { x: t.clientX - rect.left, y: t.clientY - rect.top }
  }

  const hitDot = (x: number, y: number) => {
    for (const d of dots) {
      if (Math.hypot(x - d.cx, y - d.cy) < DOT_R * 1.8) return d.idx
    }
    return -1
  }

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const p = getTouch(e)
    if (!p) return
    const idx = hitDot(p.x, p.y)
    if (idx >= 0) { setSelected([idx]); setDrawing(true); setPos(p) }
  }

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawing) return
    e.preventDefault()
    const p = getTouch(e)
    if (!p) return
    setPos(p)
    const idx = hitDot(p.x, p.y)
    if (idx >= 0 && !selected.includes(idx)) setSelected(prev => [...prev, idx])
  }

  const handleEnd = () => {
    if (!drawing) return
    setDrawing(false)
    setPos(null)
    if (selected.length > 0) {
      onComplete(selected)
      setTimeout(() => setSelected([]), 400)
    }
  }

  const lineColor = error ? '#ef4444' : 'var(--brand, #3b82f6)'
  const dotColor = error ? '#ef4444' : 'var(--brand, #3b82f6)'

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 1; i < selected.length; i++) {
    const a = dots[selected[i - 1]], b = dots[selected[i]]
    lines.push({ x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy })
  }
  if (drawing && pos && selected.length > 0) {
    const last = dots[selected[selected.length - 1]]
    lines.push({ x1: last.cx, y1: last.cy, x2: pos.x, y2: pos.y })
  }

  return (
    <div ref={gridRef} style={{ width: SIZE, height: SIZE, position: 'relative', touchAction: 'none' }}
      onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
      onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}>
      <svg width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0 }}>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={lineColor} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
        ))}
      </svg>
      {dots.map(d => (
        <div key={d.idx} style={{
          position: 'absolute', left: d.cx - DOT_R, top: d.cy - DOT_R,
          width: DOT_R * 2, height: DOT_R * 2, borderRadius: '50%',
          background: selected.includes(d.idx) ? dotColor : 'rgba(255,255,255,0.15)',
          border: `2.5px solid ${selected.includes(d.idx) ? dotColor : 'rgba(255,255,255,0.3)'}`,
          transition: 'all 0.15s', boxShadow: selected.includes(d.idx) ? `0 0 10px ${dotColor}40` : 'none',
        }} />
      ))}
    </div>
  )
}

export default function GestureLockScreen() {
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const lockRef = useRef(false)

  useEffect(() => {
    if (!isCapacitor) return
    const hash = localStorage.getItem('gesture_lock_hash')
    if (hash) {
      setLocked(true)
      lockRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!isCapacitor) return
    let cleanup: (() => void) | undefined

    import('@capacitor/app').then(({ App }) => {
      const listener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && localStorage.getItem('gesture_lock_hash')) {
          setLocked(true)
          lockRef.current = true
          setError(false)
          setAttempts(0)
        }
      })
      cleanup = () => { listener.then(l => l.remove()) }
    }).catch(() => {})

    return () => { cleanup?.() }
  }, [])

  const handlePattern = (pattern: number[]) => {
    const stored = localStorage.getItem('gesture_lock_hash')
    if (!stored) { setLocked(false); return }

    if (hashPattern(pattern) === stored) {
      setLocked(false)
      lockRef.current = false
      setError(false)
      setAttempts(0)
    } else {
      setError(true)
      setAttempts(a => a + 1)
      setTimeout(() => setError(false), 800)
    }
  }

  if (!locked) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>DuiJie</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 40 }}>
        {error ? '手势不正确，请重试' : '请绘制手势解锁'}
      </div>
      {attempts >= 5 && (
        <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 16 }}>
          已错误 {attempts} 次
        </div>
      )}
      <PatternGrid onComplete={handlePattern} error={error} />
      <div style={{ marginTop: 40, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
        绘制解锁手势以继续使用
      </div>
    </div>
  )
}
