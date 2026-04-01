import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/notifications')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
    refetchInterval: 120_000,
  })
}

export function useUsers() {
  return useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const r: ApiResponse = await fetchApi('/api/users')
      if (!r.success) throw new Error(r.message)
      return r.data || []
    },
  })
}

export function useInvalidate() {
  const qc = useQueryClient()
  return (...keys: string[]) => qc.invalidateQueries({ queryKey: keys })
}
