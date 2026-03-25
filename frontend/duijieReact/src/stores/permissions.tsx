import useUserStore from './useUserStore'

const PERMISSIONS: Record<string, string[]> = {
  'dashboard:view':       ['admin', 'sales_manager', 'tech', 'business', 'marketing', 'member', 'viewer'],
  'dashboard:clients':    ['admin', 'business'],
  'dashboard:tasks':      ['admin', 'tech', 'business', 'member'],
  'dashboard:amount':     ['admin', 'tech', 'business', 'member'],

  'project:view':         ['admin', 'sales_manager', 'tech', 'business', 'member', 'viewer'],
  'project:create':       ['admin', 'sales_manager'],
  'project:edit':         ['admin', 'sales_manager', 'tech', 'business'],
  'project:delete':       ['admin', 'sales_manager'],

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

  'partner:manage':       ['admin'],
  'staff:assignable':     ['admin', 'business', 'tech'],
}

const PERM_TO_ENTERPRISE: Record<string, string> = {
  'project:create': 'can_create_project',
  'project:edit': 'can_edit_project',
  'project:delete': 'can_delete_project',
  'client:create': 'can_manage_client',
  'client:manage': 'can_manage_client',
  'report:view': 'can_view_report',
  'task:create': 'can_manage_task',
}

export function can(role: string, permission: string): boolean {
  const allowed = PERMISSIONS[permission]
  if (allowed && allowed.includes(role)) return true
  const entKey = PERM_TO_ENTERPRISE[permission]
  if (entKey) {
    const perms = useUserStore.getState().enterprisePerms as any
    if (perms?.is_creator || perms?.[entKey]) return true
  }
  return false
}

export function usePermission(permission: string): boolean {
  const role = useUserStore(s => s.user?.role) || ''
  const enterprisePerms = useUserStore(s => s.enterprisePerms)
  const allowed = PERMISSIONS[permission]
  if (allowed && allowed.includes(role)) return true
  const entKey = PERM_TO_ENTERPRISE[permission]
  if (entKey && (enterprisePerms as any)?.is_creator) return true
  if (entKey && (enterprisePerms as any)?.[entKey]) return true
  return false
}

export function useRole(): string {
  return useUserStore(s => s.user?.role) || 'member'
}

export function Can({ action, children, fallback = null }: { action: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const allowed = usePermission(action)
  return <>{allowed ? children : fallback}</>
}
