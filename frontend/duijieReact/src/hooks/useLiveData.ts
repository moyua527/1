import { useEffect, useRef, useCallback } from 'react'
import { onSocket } from '../features/ui/smartSocket'

/**
 * 实时数据 Hook：WebSocket 数据变更 + Tab 焦点刷新
 * @param entities - 监听的实体类型列表，如 ['project', 'task']
 * @param refresh  - 数据刷新回调
 * @param opts     - 可选配置
 */
export default function useLiveData(
  entities: string[],
  refresh: () => void,
  opts: { focusThrottle?: number } = {}
) {
  const { focusThrottle = 5000 } = opts
  const lastRefresh = useRef(0)
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  const throttledRefresh = useCallback(() => {
    const now = Date.now()
    if (now - lastRefresh.current < focusThrottle) return
    lastRefresh.current = now
    refreshRef.current()
  }, [focusThrottle])

  // WebSocket data_changed 事件
  useEffect(() => {
    const off = onSocket('data_changed', (payload: any) => {
      if (entities.includes(payload?.entity)) {
        throttledRefresh()
      }
    })
    return off
  }, [entities, throttledRefresh])

  // Tab 焦点刷新
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        throttledRefresh()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [throttledRefresh])
}
