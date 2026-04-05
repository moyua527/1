import { useState, useRef, useCallback, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onRefresh: () => Promise<void> | void
  disabled?: boolean
}

const THRESHOLD = 60
const MAX_PULL = 100

export default function PullToRefresh({ children, onRefresh, disabled }: Props) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStart = useRef<{ y: number; scrollTop: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshing) return
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return
    touchStart.current = { y: e.touches[0].clientY, scrollTop: el.scrollTop }
  }, [disabled, refreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || refreshing) return
    const el = containerRef.current
    if (!el || el.scrollTop > 0) { touchStart.current = null; setPullY(0); return }
    const diff = e.touches[0].clientY - touchStart.current.y
    if (diff <= 0) { setPullY(0); return }
    const pull = Math.min(diff * 0.5, MAX_PULL)
    setPullY(pull)
    if (pull > 10) e.preventDefault()
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!touchStart.current) return
    touchStart.current = null
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
