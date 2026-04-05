import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, User, ChevronRight, ChevronLeft, Palette, Bell, Settings, Search, HelpCircle } from 'lucide-react'
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
import UserGuide from './UserGuide'
import OnboardingChecklist from './OnboardingChecklist'
// inline pull-to-refresh (lightweight, only for mobile)
import { navItems, navItemsByGroup } from '../../data/routeManifest'

const SIDEBAR_W = 228
const SIDEBAR_COLLAPSED_W = 68

export default function Layout() {
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, updateProfile, logout: storeLogout } = useUserStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<null | 'account' | 'appearance' | 'notification'>(null)
  const avatarMenuRef = useRef<HTMLDivElement>(null)
  const [dmUnread, setDmUnread] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const [ptrY, setPtrY] = useState(0)
  const [ptrRefreshing, setPtrRefreshing] = useState(false)
  const ptrStart = useRef(0)
  const ptrActive = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const role = user?.role || 'member'
  const NAV_ITEMS = navItems().filter(n => !n.perm || can(role, n.perm))
  const groups = navItemsByGroup(NAV_ITEMS)
  const currentNav = NAV_ITEMS.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))

  useEffect(() => { if (isMobile) setMobileMenuOpen(false) }, [location.pathname, isMobile])

  useEffect(() => {
    if (!user?.id) return
    const key = `guide_done_${user.id}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      const t = setTimeout(() => setGuideOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [user])

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) { setAvatarMenuOpen(false) }
    }
    if (avatarMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarMenuOpen])

  useEffect(() => { setAvatarMenuOpen(false); setSettingsTab(null) }, [location.pathname, location.search])

  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg-secondary)', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <CommandPalette />

      {/* ===== 顶栏 56px ===== */}
      <header style={{
        height: 56, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div data-tour="logo" style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)', letterSpacing: -0.5, cursor: 'pointer', flexShrink: 0, minWidth: isMobile ? 'auto' : sidebarW - 32 }}
          onClick={() => navigate('/')}>DuiJie</div>

        {/* Mobile hamburger */}
        {isMobile && (
          <>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', display: 'flex' }}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', flex: 1 }}>{currentNav?.label || ''}</span>
          </>
        )}

        {/* Desktop: 全局搜索 */}
        {!isMobile && (
          <div data-tour="search" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 8,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
              cursor: 'pointer', minWidth: 220, maxWidth: 400, flex: 1,
            }}>
            <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)', flex: 1 }}>搜索...</span>
            <kbd style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-primary)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-primary)' }}>⌘K</kbd>
          </div>
        )}

        {/* 右侧工具区 */}
        <div data-tour="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {user && <NotificationBell />}
          <ThemeToggle />
          {user && (
            <div ref={avatarMenuRef} style={{ position: 'relative' }}>
              <div onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }} title="个人菜单">
                <Avatar name={user.nickname || user.username} size={30} src={user.avatar || undefined} />
                {!isMobile && <span style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.username}</span>}
              </div>

              {avatarMenuOpen && (
                <div style={{
                  ...(isMobile && settingsTab
                    ? { position: 'fixed' as const, top: 56, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'var(--bg-primary)', overflow: 'auto' }
                    : { position: 'absolute' as const, top: 'calc(100% + 6px)', right: 0, display: 'flex', flexDirection: 'row' as const, zIndex: 200 }
                  ),
                }}>
                  {settingsTab && (
                    <SettingsPanel tab={settingsTab} onBack={() => setSettingsTab(null)} isMobile={isMobile} />
                  )}
                  {!(isMobile && settingsTab) && <div style={{
                    width: 220, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                    borderRadius: settingsTab ? '0 12px 12px 0' : 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                  }}>
                    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-secondary)', cursor: 'pointer' }}
                      onClick={() => { setAvatarMenuOpen(false); setSettingsTab(null); setProfileOpen(true) }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={user.nickname || user.username} size={44} src={user.avatar || undefined} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.username}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{role === 'admin' ? '管理员' : '成员'}</div>
                        </div>
                      </div>
                      {user.email && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
                    </div>
                    <EnterpriseSwitcher />
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
                    <div style={{ borderTop: '1px solid var(--border-secondary)', padding: '6px 0' }}>
                      <div onClick={() => { setAvatarMenuOpen(false); setSettingsTab(null); handleLogout() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', color: 'var(--color-danger)', fontSize: 13, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <LogOut size={15} /><span>退出登录</span>
                      </div>
                    </div>
                  </div>}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ===== 下方：Sidebar + Content ===== */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ===== Desktop 侧边导航 ===== */}
        {!isMobile && (
          <aside data-tour="sidebar" style={{
            width: sidebarW, flexShrink: 0, background: 'var(--bg-primary)',
            borderRight: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column',
            transition: 'width 0.2s ease', overflow: 'hidden',
          }}>
            <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px', scrollbarWidth: 'thin' }}>
              {groups.map((g, gi) => (
                <div key={g.key} style={{ marginTop: gi === 0 ? 0 : 12 }}>
                  {!sidebarCollapsed && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {g.label}
                    </div>
                  )}
                  {g.items.map(item => {
                    const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                    return (
                    <div
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      title={sidebarCollapsed ? item.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: sidebarCollapsed ? '10px 0' : '8px 10px',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                        color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-selected)' : 'transparent',
                        fontWeight: isActive ? 600 : 500, fontSize: 13,
                        transition: 'background 0.12s, color 0.12s',
                        position: 'relative' as const,
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <item.icon size={18} style={{ flexShrink: 0 }} />
                      {!sidebarCollapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                      {item.path === '/messaging' && dmUnread > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-danger)', color: '#fff',
                          fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 4px', position: sidebarCollapsed ? 'absolute' as const : 'static' as const,
                          top: sidebarCollapsed ? 4 : undefined, right: sidebarCollapsed ? 8 : undefined,
                        }}>{dmUnread > 99 ? '99+' : dmUnread}</span>
                      )}
                    </div>
                    )
                  })}
                </div>
              ))}
            </nav>

            <div style={{ padding: '4px 8px 0', flexShrink: 0 }}>
              <button data-tour="guide-btn" onClick={() => setGuideOpen(true)}
                title="新手引导"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: 8, padding: sidebarCollapsed ? '8px 0' : '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-tertiary)', fontSize: 12, transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <HelpCircle size={16} />
                {!sidebarCollapsed && <span>新手引导</span>}
              </button>
            </div>
            {/* 侧边栏折叠按钮 */}
            <div style={{ padding: '4px 8px 8px', borderTop: '1px solid var(--border-secondary)', flexShrink: 0 }}>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-tertiary)', fontSize: 12, transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>收起导航</span></>}
              </button>
            </div>
          </aside>
        )}

        {/* Mobile 下拉导航 */}
        {isMobile && mobileMenuOpen && (
          <>
            <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, top: 56, background: 'rgba(0,0,0,0.3)', zIndex: 90 }} />
            <nav style={{
              position: 'absolute', top: 56, left: 0, right: 0, background: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '8px', zIndex: 95, maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
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

        {/* ===== 主内容区 ===== */}
        <main ref={mainRef} data-tour="main-content"
          onTouchStart={isMobile ? (e) => {
            if (ptrRefreshing) return
            const el = mainRef.current
            if (!el || el.scrollTop > 0) return
            ptrStart.current = e.touches[0].clientY
            ptrActive.current = false
          } : undefined}
          onTouchMove={isMobile ? (e) => {
            if (ptrRefreshing || !ptrStart.current) return
            const el = mainRef.current
            if (!el || el.scrollTop > 0) { ptrStart.current = 0; ptrActive.current = false; setPtrY(0); return }
            const diff = e.touches[0].clientY - ptrStart.current
            if (diff < 0) { ptrActive.current = false; setPtrY(0); return }
            if (!ptrActive.current && diff < 30) return
            if (!ptrActive.current) { ptrActive.current = true }
            e.preventDefault()
            setPtrY(Math.min((diff - 30) * 0.35, 90))
          } : undefined}
          onTouchEnd={isMobile ? async () => {
            if (!ptrActive.current) { ptrStart.current = 0; return }
            ptrActive.current = false; ptrStart.current = 0
            if (ptrY >= 55) {
              setPtrRefreshing(true); setPtrY(55)
              await new Promise(r => setTimeout(r, 300))
              window.location.reload()
            } else { setPtrY(0) }
          } : undefined}
          style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: isMobile ? 12 : 24, WebkitOverflowScrolling: 'touch' as any, overscrollBehavior: 'contain' }}>
          {isMobile && (ptrY > 0 || ptrRefreshing) && (
            <div style={{ display: 'flex', justifyContent: 'center', height: ptrY || 55, overflow: 'hidden', transition: ptrY > 0 ? 'none' : 'height 0.25s ease' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #e5e7eb', borderTopColor: 'var(--brand)', margin: 'auto',
                animation: ptrRefreshing ? 'ptr-spin .7s linear infinite' : 'none',
                transform: ptrRefreshing ? 'none' : `rotate(${Math.min(ptrY / 55, 1) * 360}deg)`,
                opacity: Math.min(ptrY / 30, 1),
              }} />
            </div>
          )}
          <Outlet context={{ user, isMobile }} />
          {isMobile && <style>{`@keyframes ptr-spin{to{transform:rotate(360deg)}}`}</style>}
        </main>
      </div>

      <UserGuide open={guideOpen} onClose={() => {
        setGuideOpen(false)
        if (user) localStorage.setItem(`guide_done_${user.id}`, '1')
      }} />
      <OnboardingChecklist />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onProfileUpdated={updateProfile} />
    </div>
  )
}
