import { fetchApi } from '../../../bootstrap'

export const authApi = {
  login: (username: string, password: string) =>
    fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (data: { username: string; password: string; nickname?: string; email?: string; phone?: string; invite_code?: string }) =>
    fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerConfig: () => fetchApi('/api/auth/register-config'),
  logout: () => fetchApi('/api/auth/logout', { method: 'POST' }),
  me: () => fetchApi('/api/auth/me'),
}
