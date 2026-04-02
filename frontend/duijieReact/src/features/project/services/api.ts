import { fetchApi } from '../../../bootstrap'

export const projectApi = {
  list: (query?: Record<string, string>) => {
    const qs = query ? '?' + new URLSearchParams(query).toString() : ''
    return fetchApi(`/api/projects${qs}`)
  },
  detail: (id: string) => fetchApi(`/api/projects/${id}`),
  create: (data: any) => fetchApi('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchApi(`/api/projects/${id}`, { method: 'DELETE' }),
  teamUsers: () => fetchApi('/api/projects/team-users'),
  availableUsers: (id: string) => fetchApi(`/api/projects/${id}/available-users`),
  addMember: (id: string, data: { user_id: number; role: string; enterprise_role_id?: number }) => fetchApi(`/api/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
  updateMemberRole: (id: string, memberId: string, data: { role?: string; enterprise_role_id?: number | null }) => fetchApi(`/api/projects/${id}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeMember: (id: string, userId: string) => fetchApi(`/api/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  myPerms: (id: string) => fetchApi(`/api/projects/${id}/my-perms`),
  clientAvailableUsers: (id: string) => fetchApi(`/api/projects/${id}/client-available-users`),
  addClientMember: (id: string, data: { user_id: number }) => fetchApi(`/api/projects/${id}/client-members`, { method: 'POST', body: JSON.stringify(data) }),
  removeClientMember: (id: string, userId: string) => fetchApi(`/api/projects/${id}/client-members/${userId}`, { method: 'DELETE' }),
  // 客户企业关联审批
  sendClientRequest: (id: string, data: { to_enterprise_id: number; message?: string }) => fetchApi(`/api/projects/${id}/client-request`, { method: 'POST', body: JSON.stringify(data) }),
  getClientRequests: () => fetchApi('/api/projects/client-requests'),
  getSentClientRequests: () => fetchApi('/api/projects/client-requests/sent'),
  approveClientRequest: (requestId: number, memberIds?: number[]) => fetchApi(`/api/projects/client-requests/${requestId}/approve`, { method: 'POST', body: JSON.stringify({ member_ids: memberIds || [] }) }),
  rejectClientRequest: (requestId: number, reason?: string) => fetchApi(`/api/projects/client-requests/${requestId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  // 项目加入码
  searchByCode: (code: string) => fetchApi(`/api/projects/search-by-code?code=${encodeURIComponent(code)}`),
  joinRequest: (project_id: number, message?: string) => fetchApi('/api/projects/join-request', { method: 'POST', body: JSON.stringify({ project_id, message }) }),
  getJoinRequests: (id: string) => fetchApi(`/api/projects/${id}/join-requests`),
  taskTitleOptions: (id: string) => fetchApi(`/api/projects/${id}/task-title-options`),
  rememberTaskTitle: (id: string, title: string) => fetchApi(`/api/projects/${id}/task-title-history`, { method: 'POST', body: JSON.stringify({ title }) }),
  deleteTaskTitleHistory: (id: string, historyId: number) => fetchApi(`/api/projects/${id}/task-title-history/${historyId}`, { method: 'DELETE' }),
  updateTaskTitlePresets: (id: string, presets: string[]) => fetchApi(`/api/projects/${id}/task-title-presets`, { method: 'PATCH', body: JSON.stringify({ presets }) }),
  approveJoinRequest: (id: string, requestId: number) => fetchApi(`/api/projects/${id}/join-requests/${requestId}/approve`, { method: 'POST' }),
  rejectJoinRequest: (id: string, requestId: number) => fetchApi(`/api/projects/${id}/join-requests/${requestId}/reject`, { method: 'POST' }),
}
