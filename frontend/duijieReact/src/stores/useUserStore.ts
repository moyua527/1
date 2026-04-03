import { create } from 'zustand'
import { authApi } from '../features/auth/services/api'
import { fetchApi, clearToken } from '../bootstrap'
import useEnterpriseStore from './useEnterpriseStore'
import useNicknameStore from './useNicknameStore'

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
  setUser: (user: User | null) => void
  init: () => Promise<void>
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

  setUser: (user) => {
    writeCache(user)
    set({ user })
    if (user) {
      setTimeout(() => { useEnterpriseStore.getState().init(user.role); useNicknameStore.getState().init() }, 0)
    }
  },

  init: async () => {
    const cachedUser = get().user
    try {
      const r = await authApi.me()
      if (r.success) {
        writeCache(r.data)
        set({ user: r.data })
        useNicknameStore.getState().init()
        if (r.data.role === 'admin') {
          set({ checking: false })
          useEnterpriseStore.getState().init(r.data.role)
        } else {
          await useEnterpriseStore.getState().init(r.data.role)
          set({ checking: false })
        }
      } else if (isHardAuthFailure(r)) {
        clearToken()
        writeCache(null)
        set({ user: null, checking: false })
      } else if (cachedUser) {
        set({ user: cachedUser, checking: false })
        if (cachedUser.role !== 'admin') {
          useEnterpriseStore.getState().init(cachedUser.role).catch(() => {})
        }
      } else {
        set({ user: null, checking: false })
      }
    } catch {
      if (cachedUser) {
        set({ user: cachedUser, checking: false })
        if (cachedUser.role !== 'admin') {
          useEnterpriseStore.getState().init(cachedUser.role).catch(() => {})
        }
      } else {
        set({ user: null, checking: false })
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
    useEnterpriseStore.getState().reset()
    useNicknameStore.getState().reset()
    set({ user: null })
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
