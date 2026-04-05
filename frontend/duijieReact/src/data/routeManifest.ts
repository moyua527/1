import { type ComponentType } from 'react'
import {
  LayoutDashboard, FolderKanban, Users, ListTodo, Building2,
  MessageSquare, CalendarDays, FileText, BellRing,
  Shield, ScrollText, Plug2, Settings,
} from 'lucide-react'

export interface RouteEntry {
  path: string
  label: string
  icon: ComponentType<any>
  perm: string | null            // null = always accessible
  importFn: () => Promise<{ default: ComponentType<any> }>
  showInNav: boolean             // whether to show in sidebar/top nav
  exact?: boolean                // NavLink end prop (for '/')
  prefetch?: boolean             // prefetch on idle
  children?: RouteEntry[]        // nested routes (detail pages)
  group?: string                 // sidebar group key
}

const ROUTES: RouteEntry[] = [
  {
    path: '/', label: '仪表盘', icon: LayoutDashboard, perm: 'dashboard:view',
    importFn: () => import('../features/dashboard/index'),
    showInNav: true, exact: true, prefetch: true, group: 'workspace',
  },
  {
    path: '/projects', label: '项目管理', icon: FolderKanban, perm: 'project:view',
    importFn: () => import('../features/project/index'),
    showInNav: true, prefetch: true, group: 'business',
    children: [
      { path: '/projects/:id', label: '项目详情', icon: FolderKanban, perm: 'project:view', importFn: () => import('../features/project/components/ProjectDetail'), showInNav: false },
    ],
  },
  {
    path: '/clients', label: '客户管理', icon: Users, perm: 'client:view',
    importFn: () => import('../features/client/index'),
    showInNav: true, prefetch: true, group: 'business',
    children: [
      { path: '/clients/:id', label: '客户详情', icon: Users, perm: 'client:view', importFn: () => import('../features/client/components/ClientDetail'), showInNav: false },
    ],
  },
  {
    path: '/tasks', label: '需求看板', icon: ListTodo, perm: 'task:view',
    importFn: () => import('../features/task/index'),
    showInNav: true, prefetch: true, group: 'business',
  },
  {
    path: '/enterprise', label: '企业管理', icon: Building2, perm: 'enterprise:view',
    importFn: () => import('../features/enterprise/index'),
    showInNav: true, group: 'org',
  },
  {
    path: '/messaging', label: '消息', icon: MessageSquare, perm: 'messaging:view',
    importFn: () => import('../features/messaging/index'),
    showInNav: true, prefetch: true, group: 'workspace',
  },
  {
    path: '/calendar', label: '日历日程', icon: CalendarDays, perm: 'dashboard:view',
    importFn: () => import('../features/calendar/index'),
    showInNav: true, group: 'workspace',
  },
  {
    path: '/files', label: '文件管理', icon: FileText, perm: 'file:view',
    importFn: () => import('../features/file/index'),
    showInNav: true, group: 'business',
  },
  {
    path: '/contacts', label: '联系人', icon: Users, perm: 'client:view',
    importFn: () => import('../features/contact/index'),
    showInNav: false,
  },
  {
    path: '/notifications', label: '通知中心', icon: BellRing, perm: 'dashboard:view',
    importFn: () => import('../features/notification/index'),
    showInNav: true, group: 'workspace',
  },
  {
    path: '/users', label: '用户管理', icon: Shield, perm: 'user:manage',
    importFn: () => import('../features/user/index'),
    showInNav: true, group: 'org',
  },
  {
    path: '/audit', label: '审计日志', icon: ScrollText, perm: 'audit:view',
    importFn: () => import('../features/audit/index'),
    showInNav: true, group: 'system',
  },
  {
    path: '/partners', label: '合作方管理', icon: Plug2, perm: 'partner:manage',
    importFn: () => import('../features/partner/index'),
    showInNav: true, group: 'system',
  },
  {
    path: '/settings', label: '系统配置', icon: Settings, perm: 'settings:manage',
    importFn: () => import('../features/settings/index'),
    showInNav: true, group: 'system',
  },
  {
    path: '/user-settings', label: '个人设置', icon: Settings, perm: null,
    importFn: () => import('../features/user-settings/index'),
    showInNav: false,
  },
]

export default ROUTES

/** Flatten routes including children for route registration */
export function flatRoutes(): RouteEntry[] {
  const result: RouteEntry[] = []
  for (const r of ROUTES) {
    result.push(r)
    if (r.children) result.push(...r.children)
  }
  return result
}

/** Get nav-visible items for Layout */
export function navItems(): RouteEntry[] {
  return ROUTES.filter(r => r.showInNav)
}

/** Groups for sidebar navigation */
export const NAV_GROUPS = [
  { key: 'workspace', label: '工作台' },
  { key: 'business', label: '协作业务' },
  { key: 'org', label: '组织管理' },
  { key: 'system', label: '系统' },
] as const

/** Get nav items grouped by category */
export function navItemsByGroup(items: RouteEntry[]) {
  return NAV_GROUPS.map(g => ({
    ...g,
    items: items.filter(i => i.group === g.key),
  })).filter(g => g.items.length > 0)
}

/** Get high-frequency pages for prefetch */
export function prefetchPages(): (() => Promise<any>)[] {
  return ROUTES.filter(r => r.prefetch).map(r => r.importFn)
}
