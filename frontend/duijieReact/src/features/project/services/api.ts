import { fetchApi } from '../../../bootstrap'

export const projectApi = {
  list: (query?: Record<string, string>) => {
    const qs = query ? '?' + new URLSearchParams(query).toString() : ''
    return fetchApi(`/api/projects${qs}`)
  },
  detail: (id: string) => fetchApi(`/api/projects/${id}`),
  create: (data: any) => fetchApi('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchApi(`/api/projects/${id}`, { method: 'DELETE' }),
}
