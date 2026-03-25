import { create } from 'zustand'
import { authApi } from '../features/auth/services/api'
import { fetchApi, getToken, clearToken } from '../bootstrap'

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

interface UserState {
  user: User | null
  checking: boolean
  hasEnterprise: boolean
  setUser: (user: User | null) => void
  setHasEnterprise: (v: boolean) => void
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

const ENTERPRISE_EXEMPT_ROLES = ['admin', 'sales_manager', 'business', 'marketing', 'tech']

const useUserStore = create<UserState>((set, get) => ({
  user: readCache(),
  checking: true,
  hasEnterprise: false,

  setUser: (user) => {
    writeCache(user)
    set({ user })
  },

  setHasEnterprise: (v) => set({ hasEnterprise: v }),

  checkEnterprise: async () => {
    const user = get().user
    if (!user || ENTERPRISE_EXEMPT_ROLES.includes(user.role)) {
      set({ hasEnterprise: true })
      return
    }
    try {
      const r = await fetchApi('/api/my-enterprise')
      set({ hasEnterprise: r.success && r.data !== null })
    } catch {
      set({ hasEnterprise: false })
    }
  },

  init: async () => {
    if (!getToken()) {
      writeCache(null)
      set({ user: null, checking: false, hasEnterprise: false })
      return
    }
    try {
      const r = await authApi.me()
      if (r.success) {
        writeCache(r.data)
        set({ user: r.data })
        const role = r.data.role
        if (ENTERPRISE_EXEMPT_ROLES.includes(role)) {
          set({ hasEnterprise: true, checking: false })
        } else {
          const entR = await fetchApi('/api/my-enterprise')
          set({ hasEnterprise: entR.success && entR.data !== null, checking: false })
        }
      } else {
        writeCache(null)
        set({ user: null, checking: false, hasEnterprise: false })
      }
    } catch {
      writeCache(null)
      set({ user: null, checking: false, hasEnterprise: false })
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    clearToken()
    writeCache(null)
    set({ user: null })
    window.location.reload()
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
