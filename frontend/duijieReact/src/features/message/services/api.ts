import { fetchApi } from '../../../bootstrap'

export const messageApi = {
  list: (project_id: string, before_id?: number) => fetchApi(`/api/messages?project_id=${project_id}${before_id ? `&before_id=${before_id}` : ''}`),
  send: (data: { project_id: number; content: string }) => fetchApi('/api/messages', { method: 'POST', body: JSON.stringify(data) }),
}
