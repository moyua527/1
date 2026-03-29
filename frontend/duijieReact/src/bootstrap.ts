import { isCapacitor, SERVER_URL } from './utils/capacitor'

export const BACKEND_URL = isCapacitor
  ? SERVER_URL
  : ((window as any).__ENV__?.BACKEND_URL || '')

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function setToken(token: string) { sessionStorage.setItem('token', token) }
export function clearToken() { sessionStorage.removeItem('token') }
export function getToken() { return sessionStorage.getItem('token') }

const HTTP_STATUS_MSG: Record<number, string> = {
  429: '请求过于频繁，请稍后再试',
  502: '服务暂时不可用，请稍后重试',
  503: '服务暂时不可用，请稍后重试',
  504: '网关超时，请稍后重试',
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
  const res = await fetch(`${BACKEND_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options?.headers },
    ...options,
  })
  return parseApiResponse(res)
}

export function uploadFile(path: string, formData: FormData) {
  return fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...authHeaders() },
    body: formData,
  }).then(r => r.json())
}
