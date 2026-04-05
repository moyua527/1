import { useState, useRef, useCallback, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onRefresh: () => Promise<void> | void
  disabled?: boolean
}

const THRESHOLD = 70
const MAX_PULL = 110
const ACTIVATE_DISTANCE = 15

export default function PullToRefresh({ children, onRefresh, disabled }: Props) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isAtTop = () => {
    const el = containerRef.current
    if (!el) return false
    if (el.scrollTop > 0) return false
    let node = el.firstElementChild as HTMLElement | null
    while (node) {
      if (node.scrollTop > 0 && node.scrollHeight > node.clientHeight) return false
      node = node.firstElementChild as HTMLElement | null
    }
    return true
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshing) return
    if (!isAtTop()) return
    startY.current = e.touches[0].clientY
    pulling.current = false
  }, [disabled, refreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing || !startY.current) return

    const diff = e.touches[0].clientY - startY.current
    if (diff < 0) {
      if (pulling.current) { pulling.current = false; setPullY(0) }
      return
    }

    if (!pulling.current) {
      if (diff < ACTIVATE_DISTANCE) return
      if (!isAtTop()) { startY.current = 0; return }
      pulling.current = true
    }

    e.preventDefault()
    const pull = Math.min((diff - ACTIVATE_DISTANCE) * 0.4, MAX_PULL)
    setPullY(Math.max(0, pull))
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) { startY.current = 0; return }
    pulling.current = false
    startY.current = 0
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullY(THRESHOLD)
      try { await onRefresh() } catch { /* skip */ }
      setRefreshing(false)
    }
    setPullY(0)
  }, [pullY, refreshing, onRefresh])

  const progress = Math.min(pullY / THRESHOLD, 1)

  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'auto', minHeight: 0, position: 'relative', WebkitOverflowScrolling: 'touch' as any, overscrollBehavior: 'contain' }}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {(pullY > 0 || refreshing) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: pullY || (refreshing ? 50 : 0),
          overflow: 'hidden', transition: pullY > 0 ? 'none' : 'height 0.3s ease',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', border: '2.5px solid var(--border-primary)',
            borderTopColor: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: refreshing ? 'none' : `rotate(${progress * 360}deg)`,
            transition: refreshing ? 'none' : 'transform 0.1s',
            animation: refreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
            opacity: Math.min(progress * 2, 1),
          }} />
        </div>
      )}
      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg) } }`}</style>
      {children}
    </div>
  )
}
