import { fetchApi } from '../../../bootstrap'

export const authApi = {
  login: (username: string, password: string) =>
    fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => fetchApi('/api/auth/logout', { method: 'POST' }),
  me: () => fetchApi('/api/auth/me'),
}
