import useUserStore from './useUserStore'
import useEnterpriseStore from './useEnterpriseStore'

const PERMISSIONS: Record<string, string[]> = {
  'dashboard:view':       ['admin', 'member'],
  'dashboard:clients':    ['admin', 'member'],
  'dashboard:tasks':      ['admin', 'member'],
  'dashboard:amount':     ['admin', 'member'],

  'project:view':         ['admin', 'member'],
  'project:create':       ['admin', 'member'],
  'project:edit':         ['admin'],
  'project:delete':       ['admin'],

  'client:view':          ['admin', 'member'],
  'client:manage':        ['admin'],
  'client:create':        ['admin'],

  'opportunity:view':     ['admin', 'member'],
  'opportunity:create':   ['admin', 'member'],

  'task:view':            ['admin', 'member'],
  'task:create':          ['admin'],

  'enterprise:view':      ['admin', 'member'],

  'messaging:view':       ['admin', 'member'],

  'report:view':          ['admin'],

  'file:view':            ['admin', 'member'],

  'user:manage':          ['admin'],
  'audit:view':           ['admin'],
  'settings:manage':      ['admin'],

  'ticket:view':          ['admin', 'member'],
  'ticket:staff':         ['admin'],

  'partner:manage':       ['admin'],
  'staff:assignable':     ['admin', 'member'],
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
    const perms = useEnterpriseStore.getState().enterprisePerms as any
    if (perms?.is_creator || perms?.[entKey]) return true
  }
  return false
}

export function usePermission(permission: string): boolean {
  const role = useUserStore(s => s.user?.role) || ''
  const enterprisePerms = useEnterpriseStore(s => s.enterprisePerms)
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
