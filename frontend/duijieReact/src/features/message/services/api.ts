import { fetchApi } from '../../../bootstrap'

export const messageApi = {
  list: (project_id: string, before_id?: number) => fetchApi(`/api/messages?project_id=${project_id}${before_id ? `&before_id=${before_id}` : ''}`),
  send: (data: { project_id: number; content: string }) => fetchApi('/api/messages', { method: 'POST', body: JSON.stringify(data) }),
  sendImage: async (project_id: number, file: File) => {
    const fd = new FormData()
    fd.append('project_id', String(project_id))
    fd.append('image', file)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
    return res.json()
  },
}
