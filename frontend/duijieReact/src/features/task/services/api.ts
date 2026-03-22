import { fetchApi, uploadFile } from '../../../bootstrap'

export const taskApi = {
  list: (project_id: string) => fetchApi(`/api/tasks?project_id=${project_id}`),
  create: (data: any, files?: File[]) => {
    if (files && files.length > 0) {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, String(v)) })
      files.forEach(f => fd.append('files', f))
      return uploadFile('/api/tasks', fd)
    }
    return fetchApi('/api/tasks', { method: 'POST', body: JSON.stringify(data) })
  },
  update: (id: string, data: any) => fetchApi(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  move: (id: string, status: string, sort_order?: number) => fetchApi(`/api/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify({ status, sort_order }) }),
  remove: (id: string) => fetchApi(`/api/tasks/${id}`, { method: 'DELETE' }),
}
