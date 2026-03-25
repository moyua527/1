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

const useUserStore = create<UserState>((set, get) => ({
  user: readCache(),
  checking: true,
  hasEnterprise: true,

  setUser: (user) => {
    writeCache(user)
    set({ user })
  },

  setHasEnterprise: (v) => set({ hasEnterprise: v }),

  checkEnterprise: async () => {
    set({ hasEnterprise: true })
  },

  init: async () => {
    if (!getToken()) {
      writeCache(null)
      set({ user: null, checking: false, hasEnterprise: true })
      return
    }
    try {
      const r = await authApi.me()
      if (r.success) {
        writeCache(r.data)
        set({ user: r.data, hasEnterprise: true, checking: false })
      } else {
        writeCache(null)
        set({ user: null, checking: false, hasEnterprise: true })
      }
    } catch {
      writeCache(null)
      set({ user: null, checking: false, hasEnterprise: true })
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
