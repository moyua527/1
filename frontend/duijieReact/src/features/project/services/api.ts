import { fetchApi, uploadFile } from '../../../bootstrap'

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
  addMember: (id: string, data: { user_id: number; role: string; enterprise_role_id?: number; project_role_id?: number }) => fetchApi(`/api/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
  updateMemberRole: (id: string, memberId: string, data: { role?: string; enterprise_role_id?: number | null; project_role_id?: number | null }) => fetchApi(`/api/projects/${id}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  joinByInvite: (token: string) => fetchApi('/api/projects/join-by-invite', { method: 'POST', body: JSON.stringify({ token }) }),
  generateInviteToken: (id: string) => fetchApi(`/api/projects/${id}/invite-token`, { method: 'POST' }),
  getJoinRequests: (id: string) => fetchApi(`/api/projects/${id}/join-requests`),
  taskTitleOptions: (id: string) => fetchApi(`/api/projects/${id}/task-title-options`),
  rememberTaskTitle: (id: string, title: string) => fetchApi(`/api/projects/${id}/task-title-history`, { method: 'POST', body: JSON.stringify({ title }) }),
  deleteTaskTitleHistory: (id: string, historyId: number) => fetchApi(`/api/projects/${id}/task-title-history/${historyId}`, { method: 'DELETE' }),
  updateTaskTitlePresets: (id: string, presets: string[]) => fetchApi(`/api/projects/${id}/task-title-presets`, { method: 'PATCH', body: JSON.stringify({ presets }) }),
  approveJoinRequest: (id: string, requestId: number) => fetchApi(`/api/projects/${id}/join-requests/${requestId}/approve`, { method: 'POST' }),
  rejectJoinRequest: (id: string, requestId: number) => fetchApi(`/api/projects/${id}/join-requests/${requestId}/reject`, { method: 'POST' }),
  // 成员邀请（任何项目成员可发起，需审批）
  inviteMember: (id: string, data: { user_id: number; message?: string }) => fetchApi(`/api/projects/${id}/invite`, { method: 'POST', body: JSON.stringify(data) }),
  // 搜索可邀请用户（全局）
  searchUsersForInvite: (id: string, q: string) => fetchApi(`/api/projects/${id}/search-users?q=${encodeURIComponent(q)}`),
  exportCsv: async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/projects/export', { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return false
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projects_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    return true
  },
  importCsv: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/projects/import', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
    return res.json()
  },
  // 项目回收站
  trash: () => fetchApi('/api/projects/trash'),
  restore: (id: string) => fetchApi(`/api/projects/${id}/restore`, { method: 'PATCH' }),
  // 项目角色管理（项目级 - 兼容旧路由）
  listRoles: (id: string) => fetchApi(`/api/projects/${id}/roles`),
  createRole: (id: string, form: Record<string, any>) => fetchApi(`/api/projects/${id}/roles`, { method: 'POST', body: JSON.stringify(form) }),
  updateRole: (id: string, roleId: number, form: Record<string, any>) => fetchApi(`/api/projects/${id}/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(form) }),
  removeRole: (id: string, roleId: number) => fetchApi(`/api/projects/${id}/roles/${roleId}`, { method: 'DELETE' }),
  // 项目角色管理（企业级共享）
  listEntRoles: () => fetchApi('/api/my-enterprise/project-roles'),
  createEntRole: (form: Record<string, any>) => fetchApi('/api/my-enterprise/project-roles', { method: 'POST', body: JSON.stringify(form) }),
  updateEntRole: (roleId: number, form: Record<string, any>) => fetchApi(`/api/my-enterprise/project-roles/${roleId}`, { method: 'PUT', body: JSON.stringify(form) }),
  removeEntRole: (roleId: number) => fetchApi(`/api/my-enterprise/project-roles/${roleId}`, { method: 'DELETE' }),
  getOverview: (id: string) => fetchApi(`/api/projects/${id}/overview`),
  getActivity: (id: string, limit = 20) => fetchApi(`/api/projects/${id}/activity?limit=${limit}`),
  setNickname: (id: string, nickname: string) => fetchApi(`/api/projects/${id}/nickname`, { method: 'PATCH', body: JSON.stringify({ nickname }) }),
  setMemberRemark: (id: string, target_user_id: number, remark: string) => fetchApi(`/api/projects/${id}/member-remark`, { method: 'PATCH', body: JSON.stringify({ target_user_id, remark }) }),
  setCover: (id: string, file: File) => { const fd = new FormData(); fd.append('cover', file); return uploadFile(`/api/projects/${id}/cover`, fd) },
  setCoverUrl: (id: string, url: string) => fetchApi(`/api/projects/${id}/cover`, { method: 'POST', body: JSON.stringify({ cover_image_url: url }) }),
  removeCover: (id: string) => fetchApi(`/api/projects/${id}/cover`, { method: 'DELETE' }),
}
