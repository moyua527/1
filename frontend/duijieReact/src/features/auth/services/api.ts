import { fetchApi } from '../../../bootstrap'

export const authApi = {
  login: (username: string, password: string) =>
    fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  sendCode: (type: 'phone' | 'email', target: string) =>
    fetchApi('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ type, target }) }),
  loginByCode: (type: 'phone' | 'email', target: string, code: string) =>
    fetchApi('/api/auth/login-by-code', { method: 'POST', body: JSON.stringify({ type, target, code }) }),
  verifyCode: (type: 'phone' | 'email', target: string, code: string) =>
    fetchApi('/api/auth/verify-code', { method: 'POST', body: JSON.stringify({ type, target, code }) }),
  register: (data: { username: string; password: string; nickname?: string; email?: string; phone?: string; gender: number; area_code: string; user_type?: string; province?: string; city?: string; position?: string; company_name?: string; invite_code?: string; invite_token?: string; verify_code?: string }) =>
    fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerConfig: () => fetchApi('/api/auth/register-config'),
  logout: () => fetchApi('/api/auth/logout', { method: 'POST' }),
  me: () => fetchApi('/api/auth/me'),
}
