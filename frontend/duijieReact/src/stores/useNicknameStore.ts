import { create } from 'zustand'
import { fetchApi } from '../bootstrap'

interface NicknameState {
  /** Map of targetUserId -> nickname */
  map: Record<number, string>
  loaded: boolean
  /** Load all nicknames from server */
  init: () => Promise<void>
  /** Get display name: nickname > provided name */
  getDisplayName: (userId: number, fallback: string) => string
  /** Set a nickname for a user */
  setNickname: (targetUserId: number, nickname: string) => Promise<boolean>
  /** Remove a nickname */
  removeNickname: (targetUserId: number) => Promise<boolean>
  /** Reset on logout */
  reset: () => void
}

const useNicknameStore = create<NicknameState>((set, get) => ({
  map: {},
  loaded: false,

  init: async () => {
    try {
      const r = await fetchApi('/api/nicknames')
      if (r.success) set({ map: r.data || {}, loaded: true })
    } catch {}
  },

  getDisplayName: (userId, fallback) => {
    return get().map[userId] || fallback
  },

  setNickname: async (targetUserId, nickname) => {
    const r = await fetchApi(`/api/nicknames/${targetUserId}`, {
      method: 'PUT',
      body: JSON.stringify({ nickname }),
    })
    if (r.success) {
      set(s => ({ map: { ...s.map, [targetUserId]: nickname } }))
      return true
    }
    return false
  },

  removeNickname: async (targetUserId) => {
    const r = await fetchApi(`/api/nicknames/${targetUserId}`, { method: 'DELETE' })
    if (r.success) {
      set(s => {
        const m = { ...s.map }
        delete m[targetUserId]
        return { map: m }
      })
      return true
    }
    return false
  },

  reset: () => set({ map: {}, loaded: false }),
}))

export default useNicknameStore
