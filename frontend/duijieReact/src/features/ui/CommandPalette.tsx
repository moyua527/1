import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, FolderKanban, Users, ListTodo, TrendingUp,
  MessageSquare, BarChart3, FileText, Shield, ScrollText, Settings,
  Building2, Plus, ArrowRight, Ticket, Plug2, Clock, X, Loader2,
} from 'lucide-react'
import useUserStore from '../../stores/useUserStore'
import { can } from '../../stores/permissions'
import { fetchApi } from '../../bootstrap'

interface CmdItem {
  id: string
  label: string
  subtitle?: string
  section: string
  icon: any
  action: () => void
  keywords?: string
}

const NAV_DEFS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard, perm: 'dashboard:view', keywords: 'dashboard home 首页' },
  { path: '/projects', label: '项目管理', icon: FolderKanban, perm: 'project:view', keywords: 'project 项目列表' },
  { path: '/clients', label: '客户管理', icon: Users, perm: 'client:manage', keywords: 'client customer 客户列表' },
  { path: '/opportunities', label: '商机管理', icon: TrendingUp, perm: 'opportunity:view', keywords: 'opportunity sales 销售管道 商机' },
  { path: '/tasks', label: '需求看板', icon: ListTodo, perm: 'task:view', keywords: 'task kanban 需求 看板' },
  { path: '/enterprise', label: '企业管理', icon: Building2, perm: 'enterprise:view', keywords: 'enterprise company 企业 组织' },
  { path: '/messaging', label: '站内消息', icon: MessageSquare, perm: 'messaging:view', keywords: 'message chat dm 消息 聊天' },
  { path: '/tickets', label: '工单系统', icon: Ticket, perm: 'ticket:view', keywords: 'ticket issue 工单 问题 需求 咨询' },
  { path: '/report', label: '数据报表', icon: BarChart3, perm: 'report:view', keywords: 'report chart 报表 图表 统计' },
  { path: '/files', label: '文件管理', icon: FileText, perm: 'file:view', keywords: 'file upload 文件 上传 下载' },
  { path: '/users', label: '用户管理', icon: Shield, perm: 'user:manage', keywords: 'user account 用户 账号' },
  { path: '/knowledge', label: '知识库', icon: FileText, perm: 'dashboard:view', keywords: 'knowledge base wiki 知识 文档 文章' },
  { path: '/audit', label: '审计日志', icon: ScrollText, perm: 'audit:view', keywords: 'audit log 审计 日志 操作记录' },
  { path: '/partners', label: '合作方管理', icon: Plug2, perm: 'partner:manage', keywords: 'partner 合作方' },
  { path: '/settings', label: '系统配置', icon: Settings, perm: 'settings:manage', keywords: 'settings config 设置 配置' },
]

const ACTION_DEFS = [
  { id: 'new-project', label: '新建项目', icon: Plus, path: '/projects', perm: 'project:create', keywords: 'create new project 新建 创建 项目' },
  { id: 'new-client', label: '新建客户', icon: Plus, path: '/clients', perm: 'client:create', keywords: 'create new client 新建 创建 客户' },
  { id: 'new-opportunity', label: '新建商机', icon: Plus, path: '/opportunities', perm: 'opportunity:create', keywords: 'create new opportunity 新建 创建 商机' },
]

type SearchType = 'all' | 'project' | 'client' | 'task' | 'file'

const TYPE_FILTERS: { key: SearchType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'project', label: '项目' },
  { key: 'client', label: '客户' },
  { key: 'task', label: '需求' },
  { key: 'file', label: '文件' },
]

const HISTORY_KEY = 'search_history'
const MAX_HISTORY = 8

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(term: string) {
  const history = getHistory().filter(h => h !== term)
  history.unshift(term)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--brand-light, rgba(59,130,246,0.15))', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: '#22c55e' },
  planning: { label: '规划中', color: '#a855f7' },
  completed: { label: '已完成', color: '#6b7280' },
  paused: { label: '暂停', color: '#f59e0b' },
  submitted: { label: '待处理', color: '#3b82f6' },
  todo: { label: '待办', color: '#6b7280' },
  in_progress: { label: '进行中', color: '#22c55e' },
  pending_review: { label: '待审核', color: '#f59e0b' },
  accepted: { label: '已完成', color: '#6b7280' },
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('all')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController>()
  const nav = useNavigate()
  const role = useUserStore(s => s.user?.role) || 'member'

  const navItems: CmdItem[] = (() => {
    const result: CmdItem[] = []
    for (const d of NAV_DEFS) {
      if (!can(role, d.perm)) continue
      result.push({
        id: `nav-${d.path}`, label: d.label, section: '跳转页面', icon: d.icon, keywords: d.keywords,
        action: () => { nav(d.path); setOpen(false) },
      })
    }
    for (const d of ACTION_DEFS) {
      if (!can(role, d.perm)) continue
      result.push({
        id: d.id, label: d.label, section: '快捷操作', icon: d.icon, keywords: d.keywords,
        action: () => { nav(d.path + '?action=create'); setOpen(false) },
      })
    }
    return result
  })()

  const doSearch = useCallback(async (q: string, type: SearchType) => {
    if (q.trim().length < 2) { setSearchResults(null); return }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSearching(true)
    try {
      const r = await fetchApi(`/api/search?q=${encodeURIComponent(q.trim())}&type=${type}&limit=8`, { signal: ctrl.signal })
      if (!ctrl.signal.aborted && r.success) {
        setSearchResults(r.data)
        setShowHistory(false)
      }
    } catch { /* aborted */ }
    if (!ctrl.signal.aborted) setSearching(false)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setSearchResults(null); setShowHistory(true); setSearching(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(() => doSearch(query, searchType), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, searchType, doSearch])

  const filteredNav = query.trim()
    ? navItems.filter(item => {
        const q = query.toLowerCase()
        return item.label.toLowerCase().includes(q) || (item.keywords || '').toLowerCase().includes(q)
      })
    : navItems

  const dataItems: CmdItem[] = (() => {
    if (!searchResults) return []
    const items: CmdItem[] = []
    const q = query.trim()
    if (searchResults.projects?.length) {
      for (const p of searchResults.projects) {
        const st = STATUS_MAP[p.status]
        items.push({
          id: `proj-${p.id}`, label: p.name, subtitle: st ? st.label : p.status,
          section: '项目', icon: FolderKanban,
          action: () => { saveHistory(q); nav(`/projects/${p.id}`); setOpen(false) },
        })
      }
    }
    if (searchResults.clients?.length) {
      for (const c of searchResults.clients) {
        items.push({
          id: `cli-${c.id}`, label: c.name, subtitle: c.company || c.email || '',
          section: '客户', icon: Users,
          action: () => { saveHistory(q); nav(`/clients/${c.id}`); setOpen(false) },
        })
      }
    }
    if (searchResults.tasks?.length) {
      for (const t of searchResults.tasks) {
        const st = STATUS_MAP[t.status]
        items.push({
          id: `task-${t.id}`, label: t.title, subtitle: `${t.project_name || ''}${st ? ' · ' + st.label : ''}`,
          section: '需求', icon: ListTodo,
          action: () => { saveHistory(q); nav(`/projects/${t.project_id}?tab=tasks`); setOpen(false) },
        })
      }
    }
    if (searchResults.files?.length) {
      for (const f of searchResults.files) {
        items.push({
          id: `file-${f.id}`, label: f.original_name || f.name, subtitle: f.project_name || '',
          section: '文件', icon: FileText,
          action: () => { saveHistory(q); nav(`/projects/${f.project_id}?tab=files`); setOpen(false) },
        })
      }
    }
    return items
  })()

  const allItems = query.trim().length >= 2
    ? [...(filteredNav.length > 0 ? filteredNav.slice(0, 3) : []), ...dataItems]
    : filteredNav

  useEffect(() => { setSelectedIdx(0) }, [query, searchType])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setShowHistory(true) }
    else { setQuery(''); setSearchResults(null); setSearchType('all') }
  }, [open])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(prev => !prev) }
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allItems.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && allItems[selectedIdx]) { allItems[selectedIdx].action() }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]') as HTMLElement
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  if (!open) return null

  const history = getHistory()
  let lastSection = ''

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 580, margin: '0 12px', background: 'var(--bg-primary)', borderRadius: 16,
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'fadeIn 0.15s ease-out',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border-primary)' }}>
          <Search size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleListKey}
            placeholder="搜索项目、客户、需求、文件..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-heading)', background: 'transparent' }}
          />
          {searching && <Loader2 size={16} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
          {query && (
            <span onClick={() => setQuery('')} style={{ cursor: 'pointer', display: 'flex', padding: 2 }}>
              <X size={16} style={{ color: 'var(--text-tertiary)' }} />
            </span>
          )}
          <kbd style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-primary)', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'inherit', flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Type filter chips */}
        {query.trim().length >= 2 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border-primary)', flexWrap: 'wrap' }}>
            {TYPE_FILTERS.map(f => (
              <button key={f.key} onClick={() => setSearchType(f.key)}
                style={{
                  padding: '4px 12px', borderRadius: 14, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: searchType === f.key ? '1px solid var(--brand)' : '1px solid var(--border-primary)',
                  background: searchType === f.key ? 'var(--brand-light, rgba(59,130,246,0.1))' : 'transparent',
                  color: searchType === f.key ? 'var(--brand)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Results list */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto', padding: '8px' }}>
          {/* Search history (when no query) */}
          {showHistory && !query.trim() && history.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: 0.5 }}>
                <span style={{ flex: 1 }}>最近搜索</span>
                <span onClick={() => { clearHistory(); setShowHistory(false) }}
                  style={{ cursor: 'pointer', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  清空
                </span>
              </div>
              {history.map(h => (
                <div key={h} onClick={() => setQuery(h)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Clock size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}

          {allItems.length === 0 && query.trim() && !searching && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
              没有匹配的结果
            </div>
          )}

          {allItems.map((item, idx) => {
            const showSection = item.section !== lastSection
            lastSection = item.section
            const Icon = item.icon
            const isSelected = idx === selectedIdx
            return (
              <div key={item.id}>
                {showSection && (
                  <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: 0.5 }}>
                    {item.section}
                  </div>
                )}
                <div
                  data-selected={isSelected}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                    cursor: 'pointer', transition: 'background 0.1s',
                    background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                    color: isSelected ? 'var(--text-heading)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0, color: isSelected ? 'var(--brand)' : 'var(--text-tertiary)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: isSelected ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <HighlightText text={item.label} query={query.trim().length >= 2 ? query.trim() : ''} />
                    </div>
                    {item.subtitle && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-disabled)', opacity: isSelected ? 1 : 0, flexShrink: 0 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border-primary)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          <span><kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid var(--border-primary)', fontFamily: 'inherit' }}>↑↓</kbd> 导航</span>
          <span><kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid var(--border-primary)', fontFamily: 'inherit' }}>Enter</kbd> 确认</span>
          <span style={{ marginLeft: 'auto' }}><kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid var(--border-primary)', fontFamily: 'inherit' }}>Ctrl+K</kbd> 打开</span>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
