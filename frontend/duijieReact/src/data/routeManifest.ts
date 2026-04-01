import { type ComponentType } from 'react'
import {
  LayoutDashboard, FolderKanban, Users, ListTodo, TrendingUp, Building2,
  MessageSquare, Ticket, CalendarDays, BarChart3, FileText, BellRing,
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
}

const ROUTES: RouteEntry[] = [
  {
    path: '/', label: '仪表盘', icon: LayoutDashboard, perm: 'dashboard:view',
    importFn: () => import('../features/dashboard/index'),
    showInNav: true, exact: true, prefetch: true,
  },
  {
    path: '/projects', label: '项目管理', icon: FolderKanban, perm: 'project:view',
    importFn: () => import('../features/project/index'),
    showInNav: true, prefetch: true,
    children: [
      { path: '/projects/:id', label: '项目详情', icon: FolderKanban, perm: 'project:view', importFn: () => import('../features/project/components/ProjectDetail'), showInNav: false },
    ],
  },
  {
    path: '/clients', label: '客户管理', icon: Users, perm: 'client:view',
    importFn: () => import('../features/client/index'),
    showInNav: true, prefetch: true,
    children: [
      { path: '/clients/:id', label: '客户详情', icon: Users, perm: 'client:view', importFn: () => import('../features/client/components/ClientDetail'), showInNav: false },
    ],
  },
  {
    path: '/opportunities', label: '商机管理', icon: TrendingUp, perm: 'opportunity:view',
    importFn: () => import('../features/opportunity/index'),
    showInNav: true,
  },
  {
    path: '/tasks', label: '任务看板', icon: ListTodo, perm: 'task:view',
    importFn: () => import('../features/task/index'),
    showInNav: true, prefetch: true,
  },
  {
    path: '/enterprise', label: '企业管理', icon: Building2, perm: 'enterprise:view',
    importFn: () => import('../features/enterprise/index'),
    showInNav: true,
  },
  {
    path: '/messaging', label: '消息', icon: MessageSquare, perm: 'messaging:view',
    importFn: () => import('../features/messaging/index'),
    showInNav: true, prefetch: true,
  },
  {
    path: '/tickets', label: '工单系统', icon: Ticket, perm: 'ticket:view',
    importFn: () => import('../features/ticket/index'),
    showInNav: true,
  },
  {
    path: '/calendar', label: '日历日程', icon: CalendarDays, perm: 'dashboard:view',
    importFn: () => import('../features/calendar/index'),
    showInNav: true,
  },
  {
    path: '/report', label: '数据报表', icon: BarChart3, perm: 'report:view',
    importFn: () => import('../features/dashboard/Report'),
    showInNav: true,
  },
  {
    path: '/files', label: '文件管理', icon: FileText, perm: 'file:view',
    importFn: () => import('../features/file/index'),
    showInNav: true,
  },
  {
    path: '/contacts', label: '联系人', icon: Users, perm: 'client:view',
    importFn: () => import('../features/contact/index'),
    showInNav: false,
  },
  {
    path: '/notifications', label: '通知中心', icon: BellRing, perm: 'dashboard:view',
    importFn: () => import('../features/notification/index'),
    showInNav: true,
  },
  {
    path: '/users', label: '用户管理', icon: Shield, perm: 'user:manage',
    importFn: () => import('../features/user/index'),
    showInNav: true,
  },
  {
    path: '/audit', label: '审计日志', icon: ScrollText, perm: 'audit:view',
    importFn: () => import('../features/audit/index'),
    showInNav: true,
  },
  {
    path: '/partners', label: '合作方管理', icon: Plug2, perm: 'partner:manage',
    importFn: () => import('../features/partner/index'),
    showInNav: true,
  },
  {
    path: '/settings', label: '系统配置', icon: Settings, perm: 'settings:manage',
    importFn: () => import('../features/settings/index'),
    showInNav: true,
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

/** Get high-frequency pages for prefetch */
export function prefetchPages(): (() => Promise<any>)[] {
  return ROUTES.filter(r => r.prefetch).map(r => r.importFn)
}
