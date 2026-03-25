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
  teamUsers: () => fetchApi('/api/projects/team-users'),
  availableUsers: (id: string) => fetchApi(`/api/projects/${id}/available-users`),
  addMember: (id: string, data: { user_id: number; role: string }) => fetchApi(`/api/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
  removeMember: (id: string, userId: string) => fetchApi(`/api/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  clientAvailableUsers: (id: string) => fetchApi(`/api/projects/${id}/client-available-users`),
  addClientMember: (id: string, data: { user_id: number }) => fetchApi(`/api/projects/${id}/client-members`, { method: 'POST', body: JSON.stringify(data) }),
  removeClientMember: (id: string, userId: string) => fetchApi(`/api/projects/${id}/client-members/${userId}`, { method: 'DELETE' }),
}
