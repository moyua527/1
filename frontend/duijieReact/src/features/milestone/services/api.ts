import { fetchApi } from '../../../bootstrap'

export const milestoneApi = {
  list: (project_id: string) => fetchApi(`/api/milestones?project_id=${project_id}`),
  create: (data: { project_id: number; title: string; due_date?: string }) => fetchApi('/api/milestones', { method: 'POST', body: JSON.stringify(data) }),
  toggle: (id: string) => fetchApi(`/api/milestones/${id}/toggle`, { method: 'PATCH' }),
}
