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
  register: (data: { username: string; password: string; invite_token?: string }) =>
    fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (type: 'phone' | 'email', target: string) =>
    fetchApi('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ type, target }) }),
  resetPassword: (type: 'phone' | 'email', target: string, code: string, new_password: string) =>
    fetchApi('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ type, target, code, new_password }) }),
  registerConfig: () => fetchApi('/api/auth/register-config'),
  logout: () => fetchApi('/api/auth/logout', { method: 'POST' }),
  me: () => fetchApi('/api/auth/me'),
}
