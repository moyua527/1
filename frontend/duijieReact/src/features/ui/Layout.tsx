import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, ListTodo, Menu, X, LogOut, BarChart3, Shield, Settings, TrendingUp, MessageSquare, ScrollText, FileText, Building2, Ticket, Plug2, ArrowLeft } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import { can } from '../../stores/permissions'
import { onSocket } from './smartSocket'
import Avatar from './Avatar'
import useIsMobile from './useIsMobile'
import NotificationBell from './NotificationBell'
import CommandPalette from './CommandPalette'
import ProfileModal from './ProfileModal'

const ALL_NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard, perm: 'dashboard:view' },
  { path: '/projects', label: '项目管理', icon: FolderKanban, perm: 'project:view' },
  { path: '/clients', label: '客户管理', icon: Users, perm: 'client:manage' },
  { path: '/opportunities', label: '商机管理', icon: TrendingUp, perm: 'opportunity:view' },
  { path: '/tasks', label: '任务看板', icon: ListTodo, perm: 'task:view' },
  { path: '/enterprise', label: '企业管理', icon: Building2, perm: 'enterprise:view' },
  { path: '/messaging', label: '站内消息', icon: MessageSquare, perm: 'messaging:view' },
  { path: '/tickets', label: '工单系统', icon: Ticket, perm: 'ticket:view' },
  { path: '/report', label: '数据报表', icon: BarChart3, perm: 'report:view' },
  { path: '/files', label: '文件管理', icon: FileText, perm: 'file:view' },
  { path: '/users', label: '用户管理', icon: Shield, perm: 'user:manage' },
  { path: '/audit', label: '审计日志', icon: ScrollText, perm: 'audit:view' },
  { path: '/partners', label: '合作方管理', icon: Plug2, perm: 'partner:manage' },
  { path: '/settings', label: '系统配置', icon: Settings, perm: 'settings:manage' },
]

const roleLabel: Record<string, string> = {
  admin: '管理员', member: '成员',
}

const s = {
  wrapper: { display: 'flex', height: '100%', minHeight: 0, flex: 1, background: '#f1f5f9', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" } as React.CSSProperties,
  sidebar: { width: 240, background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s' } as React.CSSProperties,
  sidebarCollapsed: { width: 0, overflow: 'hidden', borderRight: 'none' } as React.CSSProperties,
  logo: { padding: '20px 24px', fontSize: 20, fontWeight: 700, color: '#1e40af', borderBottom: '1px solid #e2e8f0', letterSpacing: -0.5 } as React.CSSProperties,
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 } as React.CSSProperties,
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.15s', touchAction: 'manipulation' as const, WebkitTapHighlightColor: 'transparent' } as React.CSSProperties,
  navItemActive: { background: '#eff6ff', color: '#2563eb', fontWeight: 600 } as React.CSSProperties,
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 } as React.CSSProperties,
  header: { height: 56, background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 } as React.CSSProperties,
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b', display: 'flex', alignItems: 'center' } as React.CSSProperties,
  headerTitle: { fontSize: 16, fontWeight: 600, color: '#0f172a', flex: 1 } as React.CSSProperties,
  content: { flex: 1, overflow: 'auto', minHeight: 0, padding: 24, WebkitOverflowScrolling: 'touch' as any, overscrollBehavior: 'contain', touchAction: 'pan-y' as const } as React.CSSProperties,
  userArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #e2e8f0' } as React.CSSProperties,
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4, marginLeft: 'auto' } as React.CSSProperties,
 }

export default function Layout() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(true)
  const { user, updateProfile, logout: storeLogout } = useUserStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const [dmUnread, setDmUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const handleBackButton = (ev: PopStateEvent) => {
      if (collapsed === false) { setCollapsed(true); ev.preventDefault() }
    }
    window.addEventListener('popstate', handleBackButton)
    return () => window.removeEventListener('popstate', handleBackButton)
  }, [collapsed])
  const location = useLocation()
  const role = user?.role || 'member'
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(n => can(role, n.perm))
  const currentNav = NAV_ITEMS.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))
  const showBackButton = isMobile && !!currentNav && currentNav.path !== location.pathname

  useEffect(() => { setCollapsed(isMobile) }, [isMobile])
  useEffect(() => { if (isMobile) setCollapsed(true) }, [location.pathname, isMobile])

  const loadDmUnread = () => {
    fetchApi('/api/dm/conversations').then(r => {
      if (r.success) setDmUnread((r.data || []).reduce((s: number, c: any) => s + (c.unread_count || 0), 0))
    })
  }

  useEffect(() => {
    loadDmUnread()
    const offDm = onSocket('new_dm', () => loadDmUnread())
    const offReconnect = onSocket('reconnect', () => loadDmUnread())
    const t = setInterval(loadDmUnread, 15000)
    const onDmRead = () => loadDmUnread()
    window.addEventListener('dm-read', onDmRead)
    return () => { clearInterval(t); window.removeEventListener('dm-read', onDmRead); offDm(); offReconnect() }
  }, [])

  useEffect(() => { loadDmUnread() }, [location.pathname])

  const handleLogout = () => { storeLogout() }
  const handlePrimaryNavAction = () => {
    if (showBackButton) {
      if (window.history.length > 1) navigate(-1)
      else navigate(currentNav?.path || '/', { replace: true })
      return
    }
    setCollapsed(!collapsed)
  }

  const sidebarOpen = !collapsed

  const sidebarContent = (
    <>
      <div style={s.logo}>DuiJie</div>
      <nav style={s.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}), position: 'relative' as const })}
            end={item.path === '/'}
          >
            <item.icon size={18} />
            {item.label}
            {item.path === '/messaging' && dmUnread > 0 && (
              <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{dmUnread > 99 ? '99+' : dmUnread}</span>
            )}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div style={s.userArea}>
          <div onClick={() => setProfileOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
            title="查看个人信息">
            <Avatar name={user.nickname || user.username} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.username}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{roleLabel[user.role] || user.role}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout} title="登出"><LogOut size={16} /></button>
        </div>
      )}
    </>
  )

  return (
    <div style={s.wrapper}>
      <CommandPalette />
      {isMobile ? (
        <>
          {sidebarOpen && (
            <div
              role="presentation"
              onClick={() => setCollapsed(true)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 280, transition: 'opacity 0.2s', touchAction: 'manipulation' }}
            />
          )}
          <aside
            style={{
              ...s.sidebar,
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 300,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.25s ease',
              boxShadow: sidebarOpen ? '4px 0 16px rgba(0,0,0,0.1)' : 'none',
              width: 280,
              touchAction: 'manipulation',
              WebkitOverflowScrolling: 'touch' as any,
              overflowY: 'auto',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {sidebarContent}
          </aside>
        </>
      ) : (
        <aside style={sidebarOpen ? s.sidebar : { ...s.sidebar, ...s.sidebarCollapsed }}>
          {sidebarContent}
        </aside>
      )}
      <div style={s.main}>
        <header style={{ ...s.header, padding: isMobile ? '0 12px' : '0 24px' }}>
          <button style={s.menuBtn} onClick={handlePrimaryNavAction}>
            {showBackButton ? <ArrowLeft size={20} /> : sidebarOpen && !isMobile ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={s.headerTitle}>{currentNav?.label || 'DuiJie'}</span>
          {user && <NotificationBell />}
          {user && !isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{user.nickname}</span>
            </div>
          )}
        </header>
        <main style={{ ...s.content, padding: isMobile ? 12 : 24 }}>
          <Outlet context={{ user, isMobile }} />
        </main>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onProfileUpdated={updateProfile} />
    </div>
  )
}
