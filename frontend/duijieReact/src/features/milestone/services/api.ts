import { fetchApi } from '../../../bootstrap'

export const milestoneApi = {
  list: (project_id: string) => fetchApi(`/api/milestones?project_id=${project_id}`),
  create: (data: { project_id: number; title: string; description?: string; due_date?: string }) => fetchApi('/api/milestones', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/api/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchApi(`/api/milestones/${id}`, { method: 'DELETE' }),
  toggle: (id: string) => fetchApi(`/api/milestones/${id}/toggle`, { method: 'PATCH' }),
}
