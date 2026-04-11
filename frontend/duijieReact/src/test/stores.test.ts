import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react'

// Mock localStorage
const storage: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v },
    removeItem: (k: string) => { delete storage[k] },
    clear: () => Object.keys(storage).forEach(k => delete storage[k]),
  },
})

// Mock sessionStorage
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: (k: string) => storage[`s_${k}`] ?? null,
    setItem: (k: string, v: string) => { storage[`s_${k}`] = v },
    removeItem: (k: string) => { delete storage[`s_${k}`] },
    clear: () => Object.keys(storage).filter(k => k.startsWith('s_')).forEach(k => delete storage[k]),
  },
})

import useThemeStore from '../stores/useThemeStore'
import useI18nStore from '../stores/useI18nStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    act(() => {
      useThemeStore.getState().setMode('light')
    })
  })

  it('defaults to light theme', () => {
    expect(useThemeStore.getState().resolved).toBe('light')
  })

  it('toggles to dark', () => {
    act(() => {
      useThemeStore.getState().toggle()
    })
    expect(useThemeStore.getState().resolved).toBe('dark')
    expect(useThemeStore.getState().colors.bgPrimary).toBe('#0f172a')
  })

  it('sets mode and persists', () => {
    act(() => {
      useThemeStore.getState().setMode('dark')
    })
    expect(useThemeStore.getState().resolved).toBe('dark')
    expect(localStorage.getItem('theme_mode')).toBe('dark')
  })

  it('light theme has correct colors', () => {
    const { colors } = useThemeStore.getState()
    expect(colors.bgPrimary).toBe('#ffffff')
    expect(colors.textPrimary).toBe('#1e293b')
  })
})

describe('useI18nStore', () => {
  beforeEach(() => {
    localStorage.clear()
    act(() => {
      useI18nStore.getState().setLocale('zh-CN')
    })
  })

  it('defaults to zh-CN', () => {
    expect(useI18nStore.getState().locale).toBe('zh-CN')
  })

  it('translates keys', () => {
    const { t } = useI18nStore.getState()
    expect(t('nav.dashboard')).toBe('首页')
    expect(t('common.save')).toBe('保存')
  })

  it('returns key for missing translations', () => {
    const { t } = useI18nStore.getState()
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('switches to en-US', () => {
    act(() => {
      useI18nStore.getState().setLocale('en-US')
    })
    const { t, locale } = useI18nStore.getState()
    expect(locale).toBe('en-US')
    expect(t('nav.dashboard')).toBe('Dashboard')
    expect(t('common.save')).toBe('Save')
  })

  it('persists locale', () => {
    act(() => {
      useI18nStore.getState().setLocale('en-US')
    })
    expect(localStorage.getItem('locale')).toBe('en-US')
  })
})
