import { fetchApi } from '../../../bootstrap'

export const clientApi = {
  availableMembers: () => fetchApi('/api/clients/available-members'),
  list: () => fetchApi('/api/clients'),
  detail: (id: string) => fetchApi(`/api/clients/${id}`),
  create: (data: any) => fetchApi('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchApi(`/api/clients/${id}`, { method: 'DELETE' }),
  logs: (id: string) => fetchApi(`/api/clients/${id}/logs`),
  followUps: (id: string) => fetchApi(`/api/clients/${id}/follow-ups`),
  createFollowUp: (data: any) => fetchApi('/api/follow-ups', { method: 'POST', body: JSON.stringify(data) }),
  updateFollowUp: (id: number, data: any) => fetchApi(`/api/follow-ups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFollowUp: (id: number) => fetchApi(`/api/follow-ups/${id}`, { method: 'DELETE' }),
  contacts: (id: string) => fetchApi(`/api/clients/${id}/contacts`),
  createContact: (data: any) => fetchApi('/api/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: number, data: any) => fetchApi(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id: number) => fetchApi(`/api/contacts/${id}`, { method: 'DELETE' }),
  // Import
  importClients: (clients: any[]) => fetchApi('/api/clients/import', { method: 'POST', body: JSON.stringify({ clients }) }),
  // Scores
  score: (id: string) => fetchApi(`/api/clients/${id}/score`),
  allScores: () => fetchApi('/api/client-scores'),
  // AI
  aiSuggestion: (id: string) => fetchApi(`/api/clients/${id}/ai-suggestion`),
  // Tags
  allTags: () => fetchApi('/api/tags'),
  createTag: (data: any) => fetchApi('/api/tags', { method: 'POST', body: JSON.stringify(data) }),
  deleteTag: (id: number) => fetchApi(`/api/tags/${id}`, { method: 'DELETE' }),
  clientTags: (id: string) => fetchApi(`/api/clients/${id}/tags`),
  setClientTags: (id: string, tagIds: number[]) => fetchApi(`/api/clients/${id}/tags`, { method: 'PUT', body: JSON.stringify({ tagIds }) }),
  // Contracts
  contracts: (id: string) => fetchApi(`/api/clients/${id}/contracts`),
  createContract: (data: any) => fetchApi('/api/contracts', { method: 'POST', body: JSON.stringify(data) }),
  updateContract: (id: number, data: any) => fetchApi(`/api/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContract: (id: number) => fetchApi(`/api/contracts/${id}`, { method: 'DELETE' }),
  // Opportunities
  opportunities: () => fetchApi('/api/opportunities'),
  createOpportunity: (data: any) => fetchApi('/api/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  updateOpportunity: (id: number, data: any) => fetchApi(`/api/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOpportunity: (id: number) => fetchApi(`/api/opportunities/${id}`, { method: 'DELETE' }),
}
