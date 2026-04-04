import { create } from 'zustand'
import { fetchApi } from '../bootstrap'

export interface EnterprisePerms {
  is_creator?: boolean
  can_manage_members?: boolean
  can_manage_roles?: boolean
  can_create_project?: boolean
  can_edit_project?: boolean
  can_delete_project?: boolean
  can_manage_client?: boolean
  can_view_report?: boolean
  can_manage_task?: boolean
}

interface EnterpriseState {
  /** User has at least one enterprise */
  hasEnterprise: boolean
  /** User has at least one project */
  hasProjects: boolean
  /** Enterprise-level permissions for the active enterprise */
  enterprisePerms: EnterprisePerms
  /** List of enterprises user belongs to */
  myEnterprises: any[]
  /** Currently active enterprise ID */
  activeEnterpriseId: number | null

  setHasEnterprise: (v: boolean) => void
  setHasProjects: (v: boolean) => void
  /** Load enterprise data from /api/my-enterprise. Called once after auth. */
  init: (role: string) => Promise<void>
  /** Switch to a different enterprise */
  switchEnterprise: (id: number) => Promise<boolean>
  /** Re-fetch enterprise data (e.g. after creating/joining one) */
  refresh: () => Promise<void>
  /** Reset state on logout */
  reset: () => void
}

const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  hasEnterprise: true,
  hasProjects: true,
  enterprisePerms: {},
  myEnterprises: [],
  activeEnterpriseId: null,

  setHasEnterprise: (v) => set({ hasEnterprise: v }),
  setHasProjects: (v) => set({ hasProjects: v }),

  init: async (role) => {
    if (role === 'admin') {
      set({ hasEnterprise: true, hasProjects: true })
      fetchApi('/api/my-enterprise').then(r => {
        if (r.success && r.data) {
          set({
            enterprisePerms: r.data.enterprisePerms || {},
            myEnterprises: r.data.enterprises || [],
            activeEnterpriseId: r.data.activeId || null,
          })
        }
      }).catch(() => {})
      return
    }
    try {
      const r = await fetchApi('/api/my-enterprise')
      if (r.success && r.data) {
        set({
          hasEnterprise: true,
          enterprisePerms: r.data.enterprisePerms || {},
          myEnterprises: r.data.enterprises || [],
          activeEnterpriseId: r.data.activeId || null,
        })
      } else if (r.success) {
        set({ hasEnterprise: false, enterprisePerms: {}, myEnterprises: [], activeEnterpriseId: null })
        try {
          const pr = await fetchApi('/api/projects')
          const hasPrj = pr.success && Array.isArray(pr.data) && pr.data.length > 0
          set({ hasProjects: hasPrj })
        } catch {
          set({ hasProjects: false })
        }
      }
    } catch {}
  },

  switchEnterprise: async (id) => {
    const r = await fetchApi('/api/my-enterprise/switch', {
      method: 'PUT',
      body: JSON.stringify({ enterprise_id: id }),
    })
    if (r.success) {
      set({ activeEnterpriseId: id })
      // Reload perms for the new enterprise
      await get().refresh()
      return true
    }
    return false
  },

  refresh: async () => {
    try {
      const r = await fetchApi('/api/my-enterprise')
      if (r.success && r.data) {
        set({
          hasEnterprise: true,
          enterprisePerms: r.data.enterprisePerms || {},
          myEnterprises: r.data.enterprises || [],
          activeEnterpriseId: r.data.activeId || null,
        })
      } else if (r.success) {
        set({ hasEnterprise: false, enterprisePerms: {}, myEnterprises: [], activeEnterpriseId: null })
      }
    } catch {}
  },

  reset: () => set({
    hasEnterprise: true,
    hasProjects: true,
    enterprisePerms: {},
    myEnterprises: [],
    activeEnterpriseId: null,
  }),
}))

export default useEnterpriseStore
