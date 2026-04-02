import { fetchApi } from '../../../bootstrap'

/** Pure enterprise API calls — no toast, no state, just returns {success, message?, data?} */
const enterpriseApi = {
  // --- Enterprise CRUD ---
  update: (form: Record<string, any>) =>
    fetchApi('/api/my-enterprise', { method: 'PUT', body: JSON.stringify(form) }),

  remove: () =>
    fetchApi('/api/my-enterprise', { method: 'DELETE' }),

  create: (form: Record<string, any>) =>
    fetchApi('/api/my-enterprise', { method: 'POST', body: JSON.stringify(form) }),

  regenerateJoinCode: () =>
    fetchApi('/api/my-enterprise/join-code/regenerate', { method: 'POST' }),

  // --- Members ---
  lookupUser: (phone: string) =>
    fetchApi(`/api/my-enterprise/lookup-user?phone=${encodeURIComponent(phone)}`),

  addMember: (data: Record<string, any>) =>
    fetchApi('/api/my-enterprise/members', { method: 'POST', body: JSON.stringify(data) }),

  updateMember: (id: number, data: Record<string, any>) =>
    fetchApi(`/api/my-enterprise/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  removeMember: (id: number) =>
    fetchApi(`/api/my-enterprise/members/${id}`, { method: 'DELETE' }),

  changeMemberRole: (memberId: number, role: string) =>
    fetchApi(`/api/my-enterprise/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  assignRole: (memberId: number, roleId: number | null) =>
    fetchApi(`/api/my-enterprise/members/${memberId}/assign-role`, { method: 'PUT', body: JSON.stringify({ enterprise_role_id: roleId }) }),

  // --- Departments ---
  addDepartment: (data: Record<string, any>) =>
    fetchApi('/api/my-enterprise/departments', { method: 'POST', body: JSON.stringify(data) }),

  updateDepartment: (id: number, data: Record<string, any>) =>
    fetchApi(`/api/my-enterprise/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  removeDepartment: (id: number) =>
    fetchApi(`/api/my-enterprise/departments/${id}`, { method: 'DELETE' }),

  // --- Roles ---
  createRole: (form: Record<string, any>) =>
    fetchApi('/api/my-enterprise/roles', { method: 'POST', body: JSON.stringify(form) }),

  updateRole: (id: number, form: Record<string, any>) =>
    fetchApi(`/api/my-enterprise/roles/${id}`, { method: 'PUT', body: JSON.stringify(form) }),

  removeRole: (id: number) =>
    fetchApi(`/api/my-enterprise/roles/${id}`, { method: 'DELETE' }),

  // --- Join / Search ---
  searchEnterprises: (name?: string) =>
    fetchApi(`/api/my-enterprise/search${name ? `?name=${encodeURIComponent(name)}` : ''}`),

  join: (enterpriseId?: number | null, joinCode?: string) => {
    const payload: Record<string, any> = {}
    if (enterpriseId) payload.enterprise_id = enterpriseId
    if (joinCode) payload.join_code = joinCode
    return fetchApi('/api/my-enterprise/join', { method: 'POST', body: JSON.stringify(payload) })
  },

  // --- Join Requests ---
  approveJoinRequest: (id: number) =>
    fetchApi(`/api/my-enterprise/join-requests/${id}/approve`, { method: 'POST' }),

  rejectJoinRequest: (id: number) =>
    fetchApi(`/api/my-enterprise/join-requests/${id}/reject`, { method: 'POST' }),
}

export default enterpriseApi
