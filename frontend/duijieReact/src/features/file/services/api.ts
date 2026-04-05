import { fetchApi, uploadFile } from '../../../bootstrap'

export const fileApi = {
  list: (project_id: string) => fetchApi(`/api/files?project_id=${project_id}`),
  upload: (project_id: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('project_id', project_id)
    fd.append('original_name', file.name)
    return uploadFile('/api/files/upload', fd)
  },
  addUrl: (project_id: string, url: string, title?: string, description?: string) =>
    fetchApi('/api/files/url', { method: 'POST', body: JSON.stringify({ project_id, url, title, description }) }),
  addNote: (project_id: string, content: string, title?: string) =>
    fetchApi('/api/files/note', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id, content, title }) }),
  remove: (id: string) => fetchApi(`/api/files/${id}`, { method: 'DELETE' }),
  downloadUrl: (id: string) => `/api/files/${id}/download`,
}

export const resourceGroupApi = {
  create: (data: { project_id: string; name: string; visibility?: string; visible_users?: number[] }) =>
    fetchApi('/api/resource-groups', { method: 'POST', body: JSON.stringify(data) }),
  list: (project_id: string) => fetchApi(`/api/resource-groups?project_id=${project_id}`),
  detail: (id: string) => fetchApi(`/api/resource-groups/${id}`),
  update: (id: string, data: { visibility: string; visible_users?: number[] }) =>
    fetchApi(`/api/resource-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchApi(`/api/resource-groups/${id}`, { method: 'DELETE' }),
  addItem: (data: { group_id: number; type: string; content?: string; url?: string; title?: string }) =>
    fetchApi('/api/resource-groups/items', { method: 'POST', body: JSON.stringify(data) }),
  addFile: (group_id: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('group_id', String(group_id))
    fd.append('type', 'file')
    return uploadFile('/api/resource-groups/items', fd)
  },
}
