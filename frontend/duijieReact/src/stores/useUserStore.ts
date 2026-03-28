import { create } from 'zustand'
import { authApi } from '../features/auth/services/api'
import { fetchApi, clearToken } from '../bootstrap'

interface User {
  id: number
  username: string
  nickname?: string
  avatar?: string
  role: string
  email?: string
  phone?: string
  client_id?: number | null
  display_id?: string
  gender?: number
  created_at?: string
  personal_invite_code?: string
}

interface EnterprisePerms {
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

interface UserState {
  user: User | null
  checking: boolean
  hasEnterprise: boolean
  enterprisePerms: EnterprisePerms
  setUser: (user: User | null) => void
  setHasEnterprise: (v: boolean) => void
  setEnterprisePerms: (perms: EnterprisePerms) => void
  init: () => Promise<void>
  checkEnterprise: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => void
}

const CACHE_KEY = 'cached_user'

function readCache(): User | null {
  try {
    const s = localStorage.getItem(CACHE_KEY)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

function writeCache(u: User | null) {
  try {
    if (u) localStorage.setItem(CACHE_KEY, JSON.stringify(u))
    else localStorage.removeItem(CACHE_KEY)
  } catch {}
}

function isHardAuthFailure(r: any) {
  return r?.status === 401 || r?.status === 403 || r?.status === 404
}

const useUserStore = create<UserState>((set, get) => ({
  user: readCache(),
  checking: true,
  hasEnterprise: true,
  enterprisePerms: {},

  setUser: (user) => {
    writeCache(user)
    set({ user, hasEnterprise: true, enterprisePerms: {} })
    if (user) {
      setTimeout(() => get().checkEnterprise(), 0)
    }
  },

  setHasEnterprise: (v) => set({ hasEnterprise: v }),
  setEnterprisePerms: (perms) => set({ enterprisePerms: perms }),

  checkEnterprise: async () => {
    const u = get().user
    if (!u || u.role === 'admin') { set({ hasEnterprise: true }); return }
    try {
      const r = await fetchApi('/api/my-enterprise')
      if (r.success && r.data) {
        set({ hasEnterprise: true })
        if (r.data.enterprisePerms) set({ enterprisePerms: r.data.enterprisePerms })
        else set({ enterprisePerms: {} })
      } else if (r.success) {
        set({ hasEnterprise: false })
        set({ enterprisePerms: {} })
      }
    } catch {}
  },

  init: async () => {
    const cachedUser = get().user
    try {
      const r = await authApi.me()
      if (r.success) {
        writeCache(r.data)
        if (r.data.role === 'admin') {
          set({ user: r.data, hasEnterprise: true, checking: false, enterprisePerms: {} })
          fetchApi('/api/my-enterprise').then(er => {
            if (er.success && er.data?.enterprisePerms) set({ enterprisePerms: er.data.enterprisePerms })
          }).catch(() => {})
        } else {
          set({ user: r.data, hasEnterprise: true, checking: true, enterprisePerms: {} })
          await get().checkEnterprise()
          set({ checking: false })
        }
      } else if (isHardAuthFailure(r)) {
        clearToken()
        writeCache(null)
        set({ user: null, checking: false, hasEnterprise: true, enterprisePerms: {} })
      } else if (cachedUser) {
        set({ user: cachedUser, checking: false, hasEnterprise: true, enterprisePerms: {} })
        if (cachedUser.role !== 'admin') {
          get().checkEnterprise().catch(() => {})
        }
      } else {
        set({ user: null, checking: false, hasEnterprise: true, enterprisePerms: {} })
      }
    } catch {
      if (cachedUser) {
        set({ user: cachedUser, checking: false, hasEnterprise: true, enterprisePerms: {} })
        if (cachedUser.role !== 'admin') {
          get().checkEnterprise().catch(() => {})
        }
      } else {
        set({ user: null, checking: false, hasEnterprise: true, enterprisePerms: {} })
      }
    }
  },

  logout: async () => {
    try {
      const deviceToken = localStorage.getItem('push_device_token')
      if (deviceToken) {
        await fetchApi('/api/notifications/devices/unregister', { method: 'POST', body: JSON.stringify({ device_token: deviceToken }) })
      }
      await fetchApi('/api/auth/logout', { method: 'POST' })
    } catch {}
    clearToken()
    localStorage.removeItem('push_device_token')
    writeCache(null)
    set({ user: null, hasEnterprise: true, enterprisePerms: {} })
    window.location.href = '/'
  },

  updateProfile: (data) => {
    set((state) => {
      const updated = state.user ? { ...state.user, ...data } : null
      writeCache(updated)
      return { user: updated }
    })
  },
}))

export default useUserStore
