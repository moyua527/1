import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import { onSocket } from '../features/ui/smartSocket'

/**
 * 统一数据获取 Hook：React Query + WebSocket 实时更新 + Tab 焦点刷新
 * 替代手动的 useState + useEffect + fetchApi + useLiveData 模式
 *
 * @param queryKey   - React Query 缓存键
 * @param queryFn    - 数据获取函数
 * @param entities   - WebSocket 监听的实体类型列表
 * @param opts       - React Query 额外配置
 */
export default function useLiveQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  entities: string[],
  opts?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const qc = useQueryClient()
  const lastRefresh = useRef(0)

  const invalidate = useCallback(() => {
    const now = Date.now()
    if (now - lastRefresh.current < 3000) return
    lastRefresh.current = now
    qc.invalidateQueries({ queryKey })
  }, [qc, queryKey[0]])

  // WebSocket data_changed 事件
  useEffect(() => {
    const off = onSocket('data_changed', (payload: any) => {
      if (entities.includes(payload?.entity)) invalidate()
    })
    return off
  }, [entities, invalidate])

  // Tab 焦点刷新
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') invalidate()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [invalidate])

  return useQuery<T>({ queryKey, queryFn, ...opts })
}
