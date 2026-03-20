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
  remove: (id: string) => fetchApi(`/api/files/${id}`, { method: 'DELETE' }),
  downloadUrl: (id: string) => `/api/files/${id}/download`,
}
