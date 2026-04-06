import { isCapacitor, SERVER_URL } from './utils/capacitor'

export const BACKEND_URL = isCapacitor
  ? SERVER_URL
  : ((window as any).__ENV__?.BACKEND_URL || '')

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  // CSRF token from cookie
  const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  if (csrfMatch) headers['X-CSRF-Token'] = csrfMatch[1]
  return headers
}

export function setToken(token: string) { localStorage.setItem('token', token) }
export function clearToken() { localStorage.removeItem('token'); localStorage.removeItem('refresh_token') }
export function getToken() { return localStorage.getItem('token') }
export function setRefreshToken(rt: string) { localStorage.setItem('refresh_token', rt) }
export function getRefreshToken() { return localStorage.getItem('refresh_token') }

const HTTP_STATUS_MSG: Record<number, string> = {
  429: '请求过于频繁，请稍后再试',
  502: '服务暂时不可用，请稍后重试',
  503: '服务暂时不可用，请稍后重试',
  504: '网关超时，请稍后重试',
}

// Token 刷新状态管理（防止并发刷新）
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const rt = getRefreshToken()
      const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (csrfMatch) headers['X-CSRF-Token'] = csrfMatch[1]
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: rt ? JSON.stringify({ refresh_token: rt }) : undefined,
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.success && data.token) {
        setToken(data.token)
        if (data.refresh_token) setRefreshToken(data.refresh_token)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function parseApiResponse(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    await res.text()
    const message = HTTP_STATUS_MSG[res.status] || `请求失败（${res.status}）`
    return { success: false, message, status: res.status }
  }
  const data = await res.json()
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...data, status: res.status }
  }
  return { success: res.ok, data, status: res.status }
}

export async function fetchApi(path: string, options?: RequestInit) {
  const { headers: extraHeaders, ...restOpts } = options || {}
  const mergedHeaders = { 'Content-Type': 'application/json', ...authHeaders(), ...(extraHeaders as Record<string, string>) }
  const res = await fetch(`${BACKEND_URL}${path}`, {
    credentials: 'include',
    ...restOpts,
    headers: mergedHeaders,
  })
  // 401 时自动尝试刷新 token 并重试一次
  if (res.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      const retryHeaders = { 'Content-Type': 'application/json', ...authHeaders(), ...(extraHeaders as Record<string, string>) }
      const retryRes = await fetch(`${BACKEND_URL}${path}`, {
        credentials: 'include',
        ...restOpts,
        headers: retryHeaders,
      })
      return parseApiResponse(retryRes)
    }
    // refresh 也失败，清除 token 并跳转登录页
    clearToken()
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login'
    }
  }
  return parseApiResponse(res)
}

export function uploadFile(path: string, formData: FormData) {
  return fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...authHeaders() },
    body: formData,
  }).then(parseApiResponse)
}
