import { useState, useEffect, useCallback, useRef } from 'react'

const BATCH = 30

export default function useProgressiveRender<T>(items: T[], batchSize = BATCH) {
  const [limit, setLimit] = useState(batchSize)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setLimit(batchSize) }, [items.length, batchSize])

  const visible = items.slice(0, limit)
  const hasMore = limit < items.length

  const sentinelCallback = useCallback((node: HTMLDivElement | null) => {
    if (sentinelRef.current) {
      sentinelRef.current = null
    }
    if (!node) return
    sentinelRef.current = node
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLimit(prev => Math.min(prev + batchSize, items.length))
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [items.length, batchSize])

  return { visible, hasMore, sentinelRef: sentinelCallback }
}
