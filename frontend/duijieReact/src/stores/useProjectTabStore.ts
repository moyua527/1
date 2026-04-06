import { create } from 'zustand'

interface ProjectTab {
  id: number
  name: string
}

interface ProjectTabStore {
  tabs: ProjectTab[]
  openTab: (id: number, name: string) => void
  closeTab: (id: number) => number | null
  closeOthers: (id: number) => void
  closeAll: () => void
  updateTabName: (id: number, name: string) => void
  reorderTabs: (fromId: number, toId: number) => void
}

function loadTabs(): ProjectTab[] {
  try {
    const s = localStorage.getItem('project_tabs')
    return s ? JSON.parse(s) : []
  } catch {
    return []
  }
}

function saveTabs(tabs: ProjectTab[]) {
  localStorage.setItem('project_tabs', JSON.stringify(tabs))
}

const useProjectTabStore = create<ProjectTabStore>((set, get) => ({
  tabs: loadTabs(),

  openTab: (id, name) => {
    const { tabs } = get()
    if (tabs.some(t => t.id === id)) return
    const next = [...tabs, { id, name }]
    saveTabs(next)
    set({ tabs: next })
  },

  closeTab: (id) => {
    const { tabs } = get()
    const idx = tabs.findIndex(t => t.id === id)
    if (idx === -1) return null
    const next = tabs.filter(t => t.id !== id)
    saveTabs(next)
    set({ tabs: next })
    if (next.length === 0) return null
    const neighbor = next[Math.min(idx, next.length - 1)]
    return neighbor.id
  },

  closeOthers: (id) => {
    const { tabs } = get()
    const next = tabs.filter(t => t.id === id)
    saveTabs(next)
    set({ tabs: next })
  },

  closeAll: () => {
    saveTabs([])
    set({ tabs: [] })
  },

  updateTabName: (id, name) => {
    const { tabs } = get()
    const next = tabs.map(t => t.id === id ? { ...t, name } : t)
    saveTabs(next)
    set({ tabs: next })
  },

  reorderTabs: (fromId, toId) => {
    const { tabs } = get()
    const fromIdx = tabs.findIndex(t => t.id === fromId)
    const toIdx = tabs.findIndex(t => t.id === toId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
    const next = [...tabs]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    saveTabs(next)
    set({ tabs: next })
  },
}))

export default useProjectTabStore
