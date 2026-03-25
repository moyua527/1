import useUserStore from './useUserStore'

const PERMISSIONS: Record<string, string[]> = {
  'dashboard:view':       ['admin', 'sales_manager', 'tech', 'business', 'marketing', 'member', 'viewer'],
  'dashboard:clients':    ['admin', 'business'],
  'dashboard:tasks':      ['admin', 'tech', 'business', 'member'],
  'dashboard:amount':     ['admin', 'tech', 'business', 'member'],

  'project:view':         ['admin', 'sales_manager', 'tech', 'business', 'member', 'viewer'],
  'project:create':       ['admin', 'sales_manager'],
  'project:edit':         ['admin', 'tech', 'business'],
  'project:delete':       ['admin'],

  'client:view':          ['admin', 'sales_manager', 'business', 'marketing', 'member', 'viewer', 'tech'],
  'client:manage':        ['admin', 'sales_manager', 'business', 'marketing'],
  'client:create':        ['admin', 'sales_manager', 'business', 'marketing'],

  'opportunity:view':     ['admin', 'sales_manager', 'business'],
  'opportunity:create':   ['admin', 'sales_manager', 'business'],

  'task:view':            ['admin', 'sales_manager', 'tech', 'business', 'member', 'viewer'],
  'task:create':          ['admin', 'business'],

  'enterprise:view':      ['admin', 'sales_manager', 'tech', 'business', 'marketing', 'member', 'viewer'],

  'messaging:view':       ['admin', 'sales_manager', 'tech', 'business', 'marketing', 'member', 'viewer'],

  'report:view':          ['admin', 'sales_manager', 'business'],

  'file:view':            ['admin', 'sales_manager', 'tech', 'business', 'member', 'viewer'],

  'user:manage':          ['admin'],
  'audit:view':           ['admin'],
  'settings:manage':      ['admin'],

  'ticket:view':          ['admin', 'sales_manager', 'tech', 'business', 'member'],
  'ticket:staff':         ['admin', 'sales_manager', 'tech', 'business'],

  'staff:assignable':     ['admin', 'business', 'tech'],
}

export function can(role: string, permission: string): boolean {
  const allowed = PERMISSIONS[permission]
  return allowed ? allowed.includes(role) : false
}

export function usePermission(permission: string): boolean {
  const role = useUserStore(s => s.user?.role) || ''
  return can(role, permission)
}

export function useRole(): string {
  return useUserStore(s => s.user?.role) || 'member'
}

export function Can({ action, children, fallback = null }: { action: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const allowed = usePermission(action)
  return <>{allowed ? children : fallback}</>
}
