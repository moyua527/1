import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

/** 亮色主题色值 */
const lightColors = {
  // 背景
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  bgTertiary: '#f1f5f9',
  bgSidebar: '#1e293b',
  bgCard: '#ffffff',
  bgInput: '#ffffff',
  bgHover: '#f1f5f9',
  bgModal: '#ffffff',
  bgOverlay: 'rgba(0,0,0,0.5)',
  bgSelected: '#eff6ff',
  bgSuccess: '#f0fdf4',
  bgWarning: '#fffbeb',
  bgDanger: '#fef2f2',
  bgInfo: '#eff6ff',

  // 文字
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  textLink: '#3b82f6',
  textSuccess: '#16a34a',
  textWarning: '#d97706',
  textDanger: '#dc2626',

  // 边框
  borderPrimary: '#e2e8f0',
  borderSecondary: '#f1f5f9',
  borderFocus: '#3b82f6',

  // 品牌色
  brandPrimary: '#3b82f6',
  brandPrimaryHover: '#2563eb',
  brandPrimaryLight: '#eff6ff',

  // 阴影
  shadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
  shadowLg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
}

/** 暗色主题色值 */
const darkColors: typeof lightColors = {
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  bgSidebar: '#0f172a',
  bgCard: '#1e293b',
  bgInput: '#334155',
  bgHover: '#334155',
  bgModal: '#1e293b',
  bgOverlay: 'rgba(0,0,0,0.7)',
  bgSelected: '#1e3a5f',
  bgSuccess: '#052e16',
  bgWarning: '#451a03',
  bgDanger: '#450a0a',
  bgInfo: '#172554',

  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#0f172a',
  textLink: '#60a5fa',
  textSuccess: '#4ade80',
  textWarning: '#fbbf24',
  textDanger: '#f87171',

  borderPrimary: '#334155',
  borderSecondary: '#1e293b',
  borderFocus: '#60a5fa',

  brandPrimary: '#3b82f6',
  brandPrimaryHover: '#60a5fa',
  brandPrimaryLight: '#1e3a5f',

  shadow: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  shadowMd: '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)',
  shadowLg: '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.2)',
}

export type ThemeColors = typeof lightColors

interface ThemeState {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  colors: ThemeColors
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? getSystemTheme() : mode
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('theme_mode')
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'light'
}

/** 颜色映射表：浅色 -> 暗色 */
const colorMap: Record<string, string> = {
  // 背景色映射
  '#ffffff': '#1e293b', '#fff': '#1e293b',
  'rgb(255, 255, 255)': '#1e293b',
  '#f8fafc': '#0f172a', '#f1f5f9': '#0f172a',
  '#eff6ff': '#1e3a5f',
  // 文字色映射
  '#0f172a': '#f1f5f9', '#1e293b': '#e2e8f0',
  '#334155': '#cbd5e1', '#64748b': '#94a3b8',
  '#94a3b8': '#64748b',
  // 边框色映射
  '#e2e8f0': '#334155',
}

const bgProps = ['background', 'backgroundColor', 'background-color']
const colorProps = ['color']
const borderProps = ['borderColor', 'border-color', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight', 'border', 'borderTopColor', 'borderBottomColor']

function patchElement(el: HTMLElement) {
  const s = el.style
  // 背景色
  for (const prop of bgProps) {
    const v = s.getPropertyValue(prop)
    if (v) {
      const mapped = colorMap[v.trim().toLowerCase()]
      if (mapped) s.setProperty(prop, mapped, 'important')
    }
  }
  // 文字色
  for (const prop of colorProps) {
    const v = s.getPropertyValue(prop)
    if (v) {
      const mapped = colorMap[v.trim().toLowerCase()]
      if (mapped) s.setProperty(prop, mapped, 'important')
    }
  }
  // 边框色 (解析 "1px solid #xxx" 格式)
  for (const prop of borderProps) {
    const v = s.getPropertyValue(prop)
    if (v) {
      let changed = v
      for (const [from, to] of Object.entries(colorMap)) {
        if (v.includes(from)) changed = changed.split(from).join(to)
      }
      if (changed !== v) s.setProperty(prop, changed, 'important')
    }
  }
}

function unpatchElement(el: HTMLElement) {
  const s = el.style
  const allProps = [...bgProps, ...colorProps, ...borderProps]
  for (const prop of allProps) {
    if (s.getPropertyPriority(prop) === 'important') {
      s.removeProperty(prop)
    }
  }
}

let darkObserver: MutationObserver | null = null

function applyDarkPatch() {
  const all = document.querySelectorAll<HTMLElement>('#root *[style]')
  all.forEach(patchElement)
}

function removeDarkPatch() {
  const all = document.querySelectorAll<HTMLElement>('#root *[style]')
  all.forEach(unpatchElement)
}

/** 注入暗色模式动态覆盖 */
function injectDarkOverride(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  if (resolved === 'light') {
    if (darkObserver) { darkObserver.disconnect(); darkObserver = null }
    removeDarkPatch()
    return
  }
  // 立即应用一次
  requestAnimationFrame(() => applyDarkPatch())
  // 监听 DOM 变化，新增/修改的元素也需要 patch
  if (!darkObserver) {
    darkObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(n => {
            if (n instanceof HTMLElement) {
              if (n.style.cssText) patchElement(n)
              n.querySelectorAll<HTMLElement>('[style]').forEach(patchElement)
            }
          })
        } else if (m.type === 'attributes' && m.target instanceof HTMLElement) {
          patchElement(m.target)
        }
      }
    })
    const root = document.getElementById('root')
    if (root) darkObserver.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  }
}

/** 将主题色同步到 CSS 变量 + data-theme 属性 */
function syncCssVars(colors: ThemeColors, resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = resolved
  injectDarkOverride(resolved)
  const root = document.documentElement.style
  root.setProperty('--bg-primary', colors.bgPrimary)
  root.setProperty('--bg-secondary', colors.bgSecondary)
  root.setProperty('--bg-tertiary', colors.bgTertiary)
  root.setProperty('--bg-card', colors.bgCard)
  root.setProperty('--bg-hover', colors.bgHover)
  root.setProperty('--bg-selected', colors.bgSelected)
  root.setProperty('--bg-success', colors.bgSuccess)
  root.setProperty('--bg-warning', colors.bgWarning)
  root.setProperty('--bg-danger', colors.bgDanger)
  root.setProperty('--bg-danger-hover', resolved === 'dark' ? '#7f1d1d' : '#fee2e2')
  root.setProperty('--bg-warning-hover', resolved === 'dark' ? '#78350f' : '#fef3c7')

  root.setProperty('--text-heading', resolved === 'dark' ? '#f1f5f9' : '#0f172a')
  root.setProperty('--text-primary', colors.textPrimary)
  root.setProperty('--text-body', resolved === 'dark' ? '#cbd5e1' : '#334155')
  root.setProperty('--text-secondary', colors.textSecondary)
  root.setProperty('--text-tertiary', colors.textTertiary)
  root.setProperty('--text-disabled', resolved === 'dark' ? '#475569' : '#cbd5e1')
  root.setProperty('--text-inverse', colors.textInverse)

  root.setProperty('--border-primary', colors.borderPrimary)
  root.setProperty('--border-secondary', colors.borderSecondary)
  root.setProperty('--border-focus', colors.borderFocus)

  root.setProperty('--brand', colors.brandPrimary)
  root.setProperty('--brand-hover', colors.brandPrimaryHover)
  root.setProperty('--brand-light', colors.brandPrimaryLight)
  root.setProperty('--brand-light-2', resolved === 'dark' ? '#1e3a5f' : '#dbeafe')
  root.setProperty('--brand-border', resolved === 'dark' ? '#1e40af' : '#bfdbfe')

  root.setProperty('--color-success', colors.textSuccess)
  root.setProperty('--color-warning', colors.textWarning)
  root.setProperty('--color-danger', colors.textDanger)
  root.setProperty('--color-purple', resolved === 'dark' ? '#a78bfa' : '#7c3aed')
  root.setProperty('--color-orange', resolved === 'dark' ? '#fb923c' : '#ea580c')
  root.setProperty('--color-amber', resolved === 'dark' ? '#fbbf24' : '#f59e0b')
}

const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getStoredMode()
  const resolved = resolveTheme(initial)

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    syncCssVars(resolved === 'dark' ? darkColors : lightColors, resolved)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const { mode } = get()
      if (mode === 'system') {
        const newResolved = getSystemTheme()
        const newColors = newResolved === 'dark' ? darkColors : lightColors
        syncCssVars(newColors, newResolved)
        set({ resolved: newResolved, colors: newColors })
      }
    })
  }

  return {
    mode: initial,
    resolved,
    colors: resolved === 'dark' ? darkColors : lightColors,

    setMode(mode: ThemeMode) {
      const resolved = resolveTheme(mode)
      const newColors = resolved === 'dark' ? darkColors : lightColors
      localStorage.setItem('theme_mode', mode)
      syncCssVars(newColors, resolved)
      set({ mode, resolved, colors: newColors })
    },

    toggle() {
      const { resolved } = get()
      const next = resolved === 'light' ? 'dark' : 'light'
      const newColors = next === 'dark' ? darkColors : lightColors
      localStorage.setItem('theme_mode', next)
      syncCssVars(newColors, next)
      set({ mode: next, resolved: next, colors: newColors })
    },
  }
})

export default useThemeStore
export { lightColors, darkColors }
