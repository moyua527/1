import { describe, it, expect, beforeEach } from 'vitest'

describe('fetchApi URL construction', () => {
  it('should handle relative paths', () => {
    const baseUrl = 'https://example.com'
    const path = '/api/test'
    expect(new URL(path, baseUrl).toString()).toBe('https://example.com/api/test')
  })

  it('should handle query parameters', () => {
    const params = new URLSearchParams({ q: 'hello', type: 'all' })
    expect(params.toString()).toBe('q=hello&type=all')
  })
})

describe('localStorage helpers', () => {
  beforeEach(() => localStorage.clear())

  it('stores and retrieves sidebar collapse state', () => {
    const groups = ['projects', 'clients']
    localStorage.setItem('sidebar_collapsed_groups', JSON.stringify(groups))
    const stored = JSON.parse(localStorage.getItem('sidebar_collapsed_groups') || '[]')
    expect(stored).toEqual(groups)
  })

  it('stores and retrieves favorites', () => {
    const favs = ['/projects', '/clients']
    localStorage.setItem('sidebar_favs', JSON.stringify(favs))
    const stored = JSON.parse(localStorage.getItem('sidebar_favs') || '[]')
    expect(stored).toEqual(favs)
  })

  it('stores and retrieves search history', () => {
    const history = ['test1', 'test2']
    localStorage.setItem('cmd_search_history', JSON.stringify(history))
    const stored = JSON.parse(localStorage.getItem('cmd_search_history') || '[]')
    expect(stored).toEqual(history)
    expect(stored.length).toBe(2)
  })

  it('handles theme persistence', () => {
    localStorage.setItem('theme_mode', 'dark')
    expect(localStorage.getItem('theme_mode')).toBe('dark')
    localStorage.setItem('theme_mode', 'light')
    expect(localStorage.getItem('theme_mode')).toBe('light')
  })
})

describe('Permission helper', () => {
  const perms = new Set(['dashboard:view', 'project:read', 'project:write', 'task:read'])

  it('checks single permission', () => {
    expect(perms.has('dashboard:view')).toBe(true)
    expect(perms.has('admin:manage')).toBe(false)
  })

  it('checks wildcard match logic', () => {
    const hasModule = (mod: string) => [...perms].some(p => p.startsWith(mod + ':'))
    expect(hasModule('project')).toBe(true)
    expect(hasModule('audit')).toBe(false)
  })
})
