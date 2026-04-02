import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '../bootstrap'
import type { ApiResponse, Client, Project, Task, Ticket, Opportunity } from '../types'

export function useClients(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : ''
  return useQuery<Client[]>({
    queryKey: ['clients', filters],
    queryFn: async () => {
      const r: ApiResponse<Client[]> = await fetchApi(`/api/clients${params}`)
      if (!r.success) throw new Error(r.message)
      return r.data
    },
  })
}

export function useClient(id: string | undefined) {
  return useQuery<Client>({
    queryKey: ['client', id],
    queryFn: async () => {
      const r: ApiResponse<Client> = await fetchApi(`/api/clients/${id}`)
      if (!r.success) throw new Error(r.message)
      return r.data
    },
    enabled: !!id,
  })
}

export function useProjects() {
  return useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/projects?limit=200')
      if (!r.success) throw new Error(r.message)
      const d = r.data
      return Array.isArray(d?.rows) ? d.rows : Array.isArray(d) ? d : []
    },
  })
}

export function useProject(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const r: ApiResponse<Project> = await fetchApi(`/api/projects/${id}`)
      if (!r.success) throw new Error(r.message)
      return r.data
    },
    enabled: !!id,
  })
}

export function useTasks(projectId?: string) {
  const params = projectId ? `?project_id=${projectId}` : ''
  return useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const r: ApiResponse<Task[]> = await fetchApi(`/api/tasks${params}`)
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useTickets() {
  return useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const r: ApiResponse<Ticket[]> = await fetchApi('/api/tickets')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useOpportunities() {
  return useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const r: ApiResponse<Opportunity[]> = await fetchApi('/api/opportunities')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useDashboardStats() {
  return useQuery<Record<string, any>>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/dashboard/stats')
      if (!r.success) throw new Error(r.message)
      return r.data
    },
  })
}

export function useDashboardChart(days: number) {
  return useQuery<Record<string, any>>({
    queryKey: ['dashboard', 'chart', days],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi(`/api/dashboard/chart?days=${days}`)
      if (!r.success) throw new Error(r.message)
      return r.data
    },
  })
}

export function useNotifications(category = 'all') {
  return useQuery<{ notifications: any[]; unreadCount: number; unreadByCategory: Record<string, number> }>({
    queryKey: ['notifications', category],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi(`/api/notifications?limit=100&category=${category}`)
      if (!r.success) throw new Error(r.message)
      return r.data
    },
    refetchInterval: 120_000,
  })
}

export function useUsers(enabled = true) {
  return useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/users')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
    enabled,
  })
}

export function useInvalidate() {
  const qc = useQueryClient()
  return (...keys: string[]) => qc.invalidateQueries({ queryKey: keys })
}

export function useContacts() {
  return useQuery<any[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/contacts')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useFiles() {
  return useQuery<any[]>({
    queryKey: ['files'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/files/all')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useAuditLogs(page: number, filters?: { action?: string; entity?: string; keyword?: string; startDate?: string; endDate?: string }) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', '200')
  if (filters?.action) params.set('action', filters.action)
  if (filters?.entity) params.set('entity_type', filters.entity)
  if (filters?.keyword) params.set('keyword', filters.keyword)
  if (filters?.startDate) params.set('start_date', filters.startDate)
  if (filters?.endDate) params.set('end_date', filters.endDate)
  return useQuery<{ logs: any[]; total: number }>({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi(`/api/audit-logs?${params}`)
      if (!r.success) throw new Error(r.message)
      return r.data
    },
  })
}

export function usePartners() {
  return useQuery<any[]>({
    queryKey: ['partners'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/partners')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useCalendarEvents(year: number, month: number) {
  const m = month + 1
  const start = `${year}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(year, m, 0).getDate()
  const end = `${year}-${String(m).padStart(2, '0')}-${lastDay}`
  return useQuery<{ tasks: any[]; followUps: any[] }>({
    queryKey: ['calendar-events', year, month],
    queryFn: async () => {
      const [tasksR, followR] = await Promise.all([
        fetchApi(`/api/tasks?start_date=${start}&end_date=${end}`).catch(() => ({ success: false, data: [] })),
        fetchApi('/api/follow-ups').catch(() => ({ success: false, data: [] })),
      ])
      return {
        tasks: tasksR.success && Array.isArray(tasksR.data) ? tasksR.data : [],
        followUps: followR.success && Array.isArray(followR.data) ? followR.data : [],
      }
    },
  })
}

// === Enterprise hooks ===

export function useEnterpriseData() {
  return useQuery<any>({
    queryKey: ['enterprise'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/my-enterprise')
      if (!r.success) throw new Error(r.message)
      return r.data
    },
  })
}

export function useJoinRequests() {
  return useQuery<any[]>({
    queryKey: ['enterprise', 'join-requests'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/my-enterprise/join-requests')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useMyJoinRequests() {
  return useQuery<any[]>({
    queryKey: ['enterprise', 'my-requests'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/my-enterprise/my-requests')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useAllEnterprises(enabled: boolean) {
  return useQuery<any[]>({
    queryKey: ['enterprise', 'all'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/my-enterprise/all')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
    enabled,
  })
}
