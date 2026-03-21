import { fetchApi } from '../../../bootstrap'

export const authApi = {
  login: (username: string, password: string) =>
    fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string, nickname: string) =>
    fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password, nickname }) }),
  logout: () => fetchApi('/api/auth/logout', { method: 'POST' }),
  me: () => fetchApi('/api/auth/me'),
}
