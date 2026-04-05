import { fetchApi } from '../../../bootstrap'

export const milestoneApi = {
  list: (project_id: string) => fetchApi(`/api/milestones?project_id=${project_id}`),
  create: (data: { project_id: number; title: string; description?: string; due_date?: string }) => fetchApi('/api/milestones', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/api/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchApi(`/api/milestones/${id}`, { method: 'DELETE' }),
  toggle: (id: string) => fetchApi(`/api/milestones/${id}/toggle`, { method: 'PATCH' }),
  detail: (id: string) => fetchApi(`/api/milestones/${id}/detail`),
  addProgress: (id: string, content: string) => fetchApi(`/api/milestones/${id}/progress`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteProgress: (progressId: string) => fetchApi(`/api/milestones/progress/${progressId}`, { method: 'DELETE' }),
  setParticipants: (id: string, user_ids: number[]) => fetchApi(`/api/milestones/${id}/participants`, { method: 'POST', body: JSON.stringify({ user_ids }) }),
  addReminder: (id: string, remind_at: string, note?: string) => fetchApi(`/api/milestones/${id}/reminders`, { method: 'POST', body: JSON.stringify({ remind_at, note }) }),
  deleteReminder: (reminderId: string) => fetchApi(`/api/milestones/reminders/${reminderId}`, { method: 'DELETE' }),
}
