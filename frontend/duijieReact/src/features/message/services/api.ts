import { fetchApi } from '../../../bootstrap'

export const messageApi = {
  list: (project_id: string, before_id?: number) => fetchApi(`/api/messages?project_id=${project_id}${before_id ? `&before_id=${before_id}` : ''}`),
  send: (data: { project_id: number; content: string }) => fetchApi('/api/messages', { method: 'POST', body: JSON.stringify(data) }),
  sendFile: async (project_id: number, file: File) => {
    const fd = new FormData()
    fd.append('project_id', String(project_id))
    fd.append('image', file)
    const token = localStorage.getItem('token')
    const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (csrfMatch) headers['X-CSRF-Token'] = csrfMatch[1]
    const res = await fetch('/api/messages', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: fd,
    })
    return res.json()
  },
  sendImage: async (project_id: number, file: File) => {
    const fd = new FormData()
    fd.append('project_id', String(project_id))
    fd.append('image', file)
    const token = localStorage.getItem('token')
    const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (csrfMatch) headers['X-CSRF-Token'] = csrfMatch[1]
    const res = await fetch('/api/messages', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: fd,
    })
    return res.json()
  },
}
