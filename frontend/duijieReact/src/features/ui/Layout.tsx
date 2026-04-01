import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, ListTodo, Menu, X, LogOut, BarChart3, Shield, Settings, TrendingUp, MessageSquare, ScrollText, FileText, Building2, Ticket, Plug2, User, ChevronRight, Palette, Bell, CalendarDays, BellRing } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import { can } from '../../stores/permissions'
import { onSocket } from './smartSocket'
import Avatar from './Avatar'
import useIsMobile from './useIsMobile'
import NotificationBell from './NotificationBell'
import CommandPalette from './CommandPalette'
import ProfileModal from './ProfileModal'
import ThemeToggle from './ThemeToggle'
import SettingsPanel from './SettingsPanel'
import EnterpriseSwitcher from './EnterpriseSwitcher'

const ALL_NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard, perm: 'dashboard:view' },
  { path: '/projects', label: '项目管理', icon: FolderKanban, perm: 'project:view' },
  { path: '/clients', label: '客户管理', icon: Users, perm: 'client:view' },
  { path: '/opportunities', label: '商机管理', icon: TrendingUp, perm: 'opportunity:view' },
  { path: '/tasks', label: '任务看板', icon: ListTodo, perm: 'task:view' },
  { path: '/enterprise', label: '企业管理', icon: Building2, perm: 'enterprise:view' },
  { path: '/messaging', label: '消息', icon: MessageSquare, perm: 'messaging:view' },
  { path: '/tickets', label: '工单系统', icon: Ticket, perm: 'ticket:view' },
  { path: '/calendar', label: '日历日程', icon: CalendarDays, perm: 'dashboard:view' },
  { path: '/report', label: '数据报表', icon: BarChart3, perm: 'report:view' },
  { path: '/files', label: '文件管理', icon: FileText, perm: 'file:view' },
  { path: '/notifications', label: '通知中心', icon: BellRing, perm: 'dashboard:view' },
  { path: '/users', label: '用户管理', icon: Shield, perm: 'user:manage' },
  { path: '/audit', label: '审计日志', icon: ScrollText, perm: 'audit:view' },
  { path: '/partners', label: '合作方管理', icon: Plug2, perm: 'partner:manage' },
  { path: '/settings', label: '系统配置', icon: Settings, perm: 'settings:manage' },
]

export default function Layout() {
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, updateProfile, logout: storeLogout } = useUserStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<null | 'account' | 'appearance' | 'notification'>(null)
  const avatarMenuRef = useRef<HTMLDivElement>(null)
  const [dmUnread, setDmUnread] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const role = user?.role || 'member'
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(n => can(role, n.perm))
  const currentNav = NAV_ITEMS.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))

  useEffect(() => { if (isMobile) setMobileMenuOpen(false) }, [location.pathname, isMobile])

  const dmLastFetch = useRef(0)
  const loadDmUnread = () => {
    const now = Date.now()
    if (now - dmLastFetch.current < 10000) return
    dmLastFetch.current = now
    fetchApi('/api/dm/conversations').then(r => {
      if (r.success) setDmUnread((r.data || []).reduce((s: number, c: any) => s + (c.unread_count || 0), 0))
    })
  }

  useEffect(() => {
    loadDmUnread()
    const offDm = onSocket('new_dm', () => loadDmUnread())
    const offReconnect = onSocket('reconnect', () => loadDmUnread())
    const t = setInterval(loadDmUnread, 30000)
    const onDmRead = () => loadDmUnread()
    window.addEventListener('dm-read', onDmRead)
    return () => { clearInterval(t); window.removeEventListener('dm-read', onDmRead); offDm(); offReconnect() }
  }, [])

  const handleLogout = () => { storeLogout() }

  // 点击外部关闭头像菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) { setAvatarMenuOpen(false) }
    }
    if (avatarMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarMenuOpen])

  // 路由切换时关闭头像菜单
  useEffect(() => { setAvatarMenuOpen(false); setSettingsTab(null) }, [location.pathname])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg-secondary)', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <CommandPalette />

      {/* 顶部导航栏 */}
      <header style={{
        height: 52, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)', letterSpacing: -0.5, marginRight: 8, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/')}>DuiJie</div>

        {/* Desktop: 水平导航 */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 6,
                  color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-selected)' : 'transparent',
                  textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap', position: 'relative' as const,
                })}
                end={item.path === '/'}
              >
                <item.icon size={15} />
                {item.label}
                {item.path === '/messaging' && dmUnread > 0 && (
                  <span style={{ minWidth: 16, height: 16, borderRadius: 8, background: 'var(--color-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{dmUnread > 99 ? '99+' : dmUnread}</span>
                )}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Mobile: 汉堡菜单按钮 */}
        {isMobile && (
          <>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', display: 'flex' }}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', flex: 1 }}>{currentNav?.label || ''}</span>
          </>
        )}

        {/* 右侧工具区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: isMobile ? 0 : 'auto', flexShrink: 0 }}>
          {user && <NotificationBell />}
          <ThemeToggle />
          {user && (
            <div ref={avatarMenuRef} style={{ position: 'relative' }}>
              <div onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }} title="个人菜单">
                <Avatar name={user.nickname || user.username} size={28} />
                {!isMobile && <span style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.username}</span>}
              </div>

              {/* 头像下拉菜单 */}
              {avatarMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  display: 'flex', flexDirection: 'row', zIndex: 200,
                }}>
                  {/* 左侧：设置面板 */}
                  {settingsTab && (
                    <SettingsPanel tab={settingsTab} onBack={() => setSettingsTab(null)} />
                  )}

                  {/* 右侧：下拉菜单主体 */}
                  <div style={{
                    width: 220, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                    borderRadius: settingsTab ? '0 12px 12px 0' : 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                  }}>
                    {/* 用户信息头部 */}
                    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={user.nickname || user.username} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.username}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{role === 'admin' ? '管理员' : '成员'}</div>
                        </div>
                      </div>
                      {user.email && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
                    </div>

                    {/* 企业切换 */}
                    <EnterpriseSwitcher />

                    {/* 菜单项 */}
                    <div style={{ padding: '6px 0' }}>
                      {[
                        { icon: User, label: '账号与安全', tab: 'account' as const },
                        { icon: Palette, label: '外观与语言', tab: 'appearance' as const },
                        { icon: Bell, label: '通知偏好', tab: 'notification' as const },
                      ].map(item => (
                        <div key={item.tab} onClick={() => setSettingsTab(settingsTab === item.tab ? null : item.tab)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer',
                            color: settingsTab === item.tab ? 'var(--brand)' : 'var(--text-primary)',
                            background: settingsTab === item.tab ? 'var(--bg-selected)' : 'transparent',
                            fontSize: 13, transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { if (settingsTab !== item.tab) e.currentTarget.style.background = 'var(--bg-hover)' }}
                          onMouseLeave={e => { if (settingsTab !== item.tab) e.currentTarget.style.background = 'transparent' }}>
                          <item.icon size={15} style={{ color: settingsTab === item.tab ? 'var(--brand)' : 'var(--text-tertiary)' }} />
                          <span style={{ flex: 1 }}>{item.label}</span>
                          <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      ))}
                      {can(role, 'settings:manage') && (
                        <div onClick={() => { setAvatarMenuOpen(false); setSettingsTab(null); navigate('/settings') }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <Settings size={15} style={{ color: 'var(--text-tertiary)' }} />
                          <span style={{ flex: 1 }}>系统配置</span>
                          <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                    </div>

                    {/* 退出登录 */}
                    <div style={{ borderTop: '1px solid var(--border-secondary)', padding: '6px 0' }}>
                      <div onClick={() => { setAvatarMenuOpen(false); setSettingsTab(null); handleLogout() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', color: 'var(--color-danger)', fontSize: 13, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <LogOut size={15} /><span>退出登录</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile: 下拉导航菜单 */}
      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, top: 52, background: 'rgba(0,0,0,0.3)', zIndex: 90 }} />
          <nav style={{
            position: 'absolute', top: 52, left: 0, right: 0, background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '8px', zIndex: 95, maxHeight: 'calc(100vh - 52px)', overflowY: 'auto',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
          }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
                  padding: '12px 8px', borderRadius: 8, textDecoration: 'none',
                  color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-selected)' : 'transparent',
                  fontSize: 12, fontWeight: isActive ? 600 : 500,
                })}
                end={item.path === '/'}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* 主要内容 */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: isMobile ? 12 : 24, WebkitOverflowScrolling: 'touch' as any, overscrollBehavior: 'contain' }}>
        <Outlet context={{ user, isMobile }} />
      </main>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onProfileUpdated={updateProfile} />
    </div>
  )
}
