import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, FolderKanban, Users, ListTodo, TrendingUp, MessageSquare, BarChart3, FileText, Shield, ScrollText, Settings, Building2, Plus, ArrowRight, Ticket } from 'lucide-react'
import useUserStore from '../../stores/useUserStore'

interface CmdItem {
  id: string
  label: string
  section: string
  icon: any
  action: () => void
  keywords?: string
}

const NAV_DEFS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard, roles: ['admin', 'sales_manager', 'tech', 'business', 'marketing', 'member', 'viewer'], keywords: 'dashboard home 首页' },
  { path: '/projects', label: '项目管理', icon: FolderKanban, roles: ['admin', 'sales_manager', 'tech', 'business', 'member', 'viewer'], keywords: 'project 项目列表' },
  { path: '/clients', label: '客户管理', icon: Users, roles: ['admin', 'sales_manager', 'business', 'marketing'], keywords: 'client customer 客户列表' },
  { path: '/opportunities', label: '商机管理', icon: TrendingUp, roles: ['admin', 'sales_manager', 'business'], keywords: 'opportunity sales 销售管道 商机' },
  { path: '/tasks', label: '任务看板', icon: ListTodo, roles: ['admin', 'sales_manager', 'tech', 'business', 'member', 'viewer'], keywords: 'task kanban 任务 看板' },
  { path: '/enterprise', label: '企业管理', icon: Building2, roles: ['admin', 'sales_manager', 'tech', 'business', 'marketing', 'member', 'viewer'], keywords: 'enterprise company 企业 组织' },
  { path: '/messaging', label: '站内消息', icon: MessageSquare, roles: ['admin', 'sales_manager', 'tech', 'business', 'marketing', 'member', 'viewer'], keywords: 'message chat dm 消息 聊天' },
  { path: '/tickets', label: '工单系统', icon: Ticket, roles: ['admin', 'sales_manager', 'tech', 'business', 'member'], keywords: 'ticket issue 工单 问题 需求 咨询' },
  { path: '/report', label: '数据报表', icon: BarChart3, roles: ['admin', 'sales_manager', 'business'], keywords: 'report chart 报表 图表 统计' },
  { path: '/files', label: '文件管理', icon: FileText, roles: ['admin', 'sales_manager', 'tech', 'business', 'member', 'viewer'], keywords: 'file upload 文件 上传 下载' },
  { path: '/users', label: '用户管理', icon: Shield, roles: ['admin'], keywords: 'user account 用户 账号' },
  { path: '/audit', label: '审计日志', icon: ScrollText, roles: ['admin'], keywords: 'audit log 审计 日志 操作记录' },
  { path: '/settings', label: '系统配置', icon: Settings, roles: ['admin'], keywords: 'settings config 设置 配置' },
]

const ACTION_DEFS = [
  { id: 'new-project', label: '新建项目', icon: Plus, path: '/projects', roles: ['admin', 'sales_manager'], keywords: 'create new project 新建 创建 项目' },
  { id: 'new-client', label: '新建客户', icon: Plus, path: '/clients', roles: ['admin', 'sales_manager', 'business', 'marketing'], keywords: 'create new client 新建 创建 客户' },
  { id: 'new-opportunity', label: '新建商机', icon: Plus, path: '/opportunities', roles: ['admin', 'sales_manager', 'business'], keywords: 'create new opportunity 新建 创建 商机' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const role = useUserStore(s => s.user?.role) || 'member'

  const items: CmdItem[] = (() => {
    const result: CmdItem[] = []
    for (const d of NAV_DEFS) {
      if (!d.roles.includes(role)) continue
      result.push({
        id: `nav-${d.path}`,
        label: d.label,
        section: '跳转页面',
        icon: d.icon,
        keywords: d.keywords,
        action: () => { nav(d.path); setOpen(false) },
      })
    }
    for (const d of ACTION_DEFS) {
      if (!d.roles.includes(role)) continue
      result.push({
        id: d.id,
        label: d.label,
        section: '快捷操作',
        icon: d.icon,
        keywords: d.keywords,
        action: () => { nav(d.path + '?action=create'); setOpen(false) },
      })
    }
    return result
  })()

  const filtered = query.trim()
    ? items.filter(item => {
        const q = query.toLowerCase()
        return item.label.toLowerCase().includes(q) || (item.keywords || '').toLowerCase().includes(q)
      })
    : items

  useEffect(() => { setSelectedIdx(0) }, [query])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50) }
    else { setQuery('') }
  }, [open])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen(prev => !prev)
    }
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && filtered[selectedIdx]) { filtered[selectedIdx].action() }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]') as HTMLElement
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  if (!open) return null

  let lastSection = ''

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16,
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)', overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <Search size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleListKey}
            placeholder="搜索页面、操作..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#0f172a', background: 'transparent' }}
          />
          <kbd style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', fontFamily: 'inherit' }}>ESC</kbd>
        </div>

        <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              没有匹配的结果
            </div>
          )}
          {filtered.map((item, idx) => {
            const showSection = item.section !== lastSection
            lastSection = item.section
            const Icon = item.icon
            const isSelected = idx === selectedIdx
            return (
              <div key={item.id}>
                {showSection && (
                  <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    background: isSelected ? '#f1f5f9' : 'transparent',
                    color: isSelected ? '#0f172a' : '#475569',
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0, color: isSelected ? '#2563eb' : '#94a3b8' }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: isSelected ? 500 : 400 }}>{item.label}</span>
                  <ArrowRight size={14} style={{ color: '#cbd5e1', opacity: isSelected ? 1 : 0 }} />
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8' }}>
          <span><kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid #e2e8f0', fontFamily: 'inherit' }}>↑↓</kbd> 导航</span>
          <span><kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid #e2e8f0', fontFamily: 'inherit' }}>Enter</kbd> 确认</span>
          <span style={{ marginLeft: 'auto' }}><kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid #e2e8f0', fontFamily: 'inherit' }}>Ctrl+K</kbd> 打开</span>
        </div>
      </div>
    </div>
  )
}
