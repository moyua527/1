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
  remind: (id: string) => fetchApi(`/api/tasks/${id}/remind`, { method: 'POST' }),
  trash: (project_id: string) => fetchApi(`/api/tasks/trash?project_id=${project_id}`),
  restore: (id: string) => fetchApi(`/api/tasks/${id}/restore`, { method: 'PATCH' }),
  // 审核要点
  getReviewPoints: (taskId: string) => fetchApi(`/api/tasks/${taskId}/review-points`),
  addReviewPoints: (taskId: string, points: Array<{ content: string; images?: string[] }>, round_type: 'initial' | 'acceptance') =>
    fetchApi(`/api/tasks/${taskId}/review-points`, { method: 'POST', body: JSON.stringify({ points, round_type }) }),
  updateReviewPoint: (pointId: number, data: { content?: string; images?: string[] }) =>
    fetchApi(`/api/tasks/review-points/${pointId}`, { method: 'PUT', body: JSON.stringify(data) }),
  respondReviewPoint: (pointId: number, response: string) =>
    fetchApi(`/api/tasks/review-points/${pointId}/respond`, { method: 'PUT', body: JSON.stringify({ response }) }),
  confirmReviewPoint: (pointId: number) =>
    fetchApi(`/api/tasks/review-points/${pointId}/confirm`, { method: 'PUT' }),
  uploadPointImage: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return uploadFile('/api/files/upload', fd)
  },
  // 草稿
  listDrafts: (projectId: string) => fetchApi(`/api/drafts?project_id=${projectId}`),
  saveDraft: (projectId: string, title: string, description: string, files?: File[], draftId?: number, existingFiles?: any[]) => {
    const fd = new FormData()
    fd.append('project_id', projectId)
    fd.append('title', title)
    fd.append('description', description)
    if (draftId) fd.append('draft_id', String(draftId))
    if (existingFiles && existingFiles.length > 0) fd.append('existing_files', JSON.stringify(existingFiles))
    if (files) files.forEach(f => fd.append('files', f))
    return uploadFile('/api/drafts', fd)
  },
  deleteDraft: (id: number) => fetchApi(`/api/drafts/${id}`, { method: 'DELETE' }),
}
