import { fetchApi } from '../../../bootstrap'

export const messageApi = {
  list: (project_id: string, page = 1) => fetchApi(`/api/messages?project_id=${project_id}&page=${page}`),
  send: (data: { project_id: number; content: string }) => fetchApi('/api/messages', { method: 'POST', body: JSON.stringify(data) }),
}
