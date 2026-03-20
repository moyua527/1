import { fetchApi } from '../../../bootstrap'

export const taskApi = {
  list: (project_id: string) => fetchApi(`/api/tasks?project_id=${project_id}`),
  create: (data: any) => fetchApi('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  move: (id: string, status: string, sort_order?: number) => fetchApi(`/api/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify({ status, sort_order }) }),
}
