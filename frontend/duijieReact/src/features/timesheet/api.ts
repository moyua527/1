import { fetchApi } from '../../bootstrap'

export const timesheetApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/api/timesheets${qs}`)
  },
  summary: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/api/timesheets/summary${qs}`)
  },
  create: (data: { project_id: number; task_id?: number; work_date: string; hours: number; description?: string }) =>
    fetchApi('/api/timesheets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    fetchApi(`/api/timesheets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    fetchApi(`/api/timesheets/${id}`, { method: 'DELETE' }),
}
