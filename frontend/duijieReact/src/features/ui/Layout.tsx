import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User, Shield, ChevronRight, ChevronLeft, Palette, Bell, Settings, Search, HelpCircle, Volume2, ArrowLeft } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import { can } from '../../stores/permissions'
import { onSocket, setSocketUserId, startSSE, stopSSE } from './smartSocket'
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
import { navItems, navItemsByGroup } from '../../data/routeManifest'

const SIDEBAR_W = 228
const SIDEBAR_COLLAPSED_W = 68

export default function Layout() {
  const isMobile = useIsMobile()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, updateProfile, logout: storeLogout } = useUserStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<null | 'profile' | 'account' | 'sound' | 'appearance' | 'notification'>(null)
  const avatarMenuRef = useRef<HTMLDivElement>(null)
  const [dmUnread, setDmUnread] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const [ptrY, setPtrY] = useState(0)
  const [ptrRefreshing, setPtrRefreshing] = useState(false)
  const ptrYRef = useRef(0)
  const ptrRefreshingRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const role = user?.role || 'member'
  const NAV_ITEMS = navItems().filter(n => !n.perm || can(role, n.perm))
  const groups = navItemsByGroup(NAV_ITEMS)
  const currentNav = NAV_ITEMS.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))

  

  useEffect(() => {
    if (!user?.id) return
    const key = `guide_done_${user.id}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      const t = setTimeout(() => setGuideOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [user])

  useEffect(() => {
    setSocketUserId(user?.id ?? null)
    if (user?.id) startSSE(); else stopSSE()
    return () => stopSSE()
  }, [user?.id])

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

  useEffect(() => {
    const el = mainRef.current
    if (!el || !isMobile) return

    let startY = 0
    let active = false

    const isAllAtTop = (target: EventTarget | null): boolean => {
      if (el.scrollTop > 0) return false
      let node = target as HTMLElement | null
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight + 1 && node.scrollTop > 1) return false
        node = node.parentElement
      }
      return true
    }

    const onStart = (e: TouchEvent) => {
      if (ptrRefreshingRef.current) return
      if (!isAllAtTop(e.target)) return
      startY = e.touches[0].clientY
      active = false
    }

    const onMove = (e: TouchEvent) => {
      if (ptrRefreshingRef.current || !startY) return
      if (!isAllAtTop(e.target)) { startY = 0; active = false; ptrYRef.current = 0; setPtrY(0); return }
      const diff = e.touches[0].clientY - startY
      if (diff < 0) { active = false; ptrYRef.current = 0; setPtrY(0); return }
      if (!active && diff < 20) return
      if (!active) active = true
      e.preventDefault()
      const y = Math.min((diff - 20) * 0.4, 100)
      ptrYRef.current = y
      setPtrY(y)
    }

    const onEnd = () => {
      if (!active) { startY = 0; return }
      active = false; startY = 0
      if (ptrYRef.current >= 55) {
        ptrRefreshingRef.current = true
        setPtrRefreshing(true)
        ptrYRef.current = 55
        setPtrY(55)
        setTimeout(() => window.location.reload(), 300)
      } else {
        ptrYRef.current = 0
        setPtrY(0)
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [isMobile])

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

        {/* Mobile: current page title */}
        {isMobile && (
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', flex: 1 }}>{currentNav?.label || ''}</span>
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
                  position: 'absolute' as const, top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                }}>
                  <div style={{
                    width: 220, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                    borderRadius: 12,
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
                      <div onClick={() => { setAvatarMenuOpen(false); setSettingsTab('profile') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Settings size={15} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ flex: 1 }}>设置</span>
                        <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
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
                  </div>
                </div>
              )}

              {/* 设置弹窗 - PC:600x600居中 / 移动端:全屏单列 */}
              {settingsTab && !isMobile && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
                 onClick={() => setSettingsTab(null)}>
                  <div style={{ width: 600, height: 600, maxWidth: '95vw', maxHeight: '90vh', background: 'var(--bg-primary)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'row' }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ width: 160, flexShrink: 0, borderRight: '1px solid var(--border-secondary)', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {([
                        { icon: User, label: '个人信息', tab: 'profile' as const },
                        { icon: Shield, label: '账号与安全', tab: 'account' as const },
                        { icon: Volume2, label: '声音设置', tab: 'sound' as const },
                        { icon: Palette, label: '外观与语言', tab: 'appearance' as const },
                        { icon: Bell, label: '通知偏好', tab: 'notification' as const },
                      ]).map(item => (
                        <div key={item.tab} onClick={() => setSettingsTab(item.tab)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', cursor: 'pointer',
                            fontSize: 13, fontWeight: settingsTab === item.tab ? 600 : 400,
                            color: settingsTab === item.tab ? 'var(--brand)' : 'var(--text-primary)',
                            background: settingsTab === item.tab ? 'var(--bg-selected)' : 'transparent',
                            borderLeft: settingsTab === item.tab ? '3px solid var(--brand)' : '3px solid transparent',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (settingsTab !== item.tab) e.currentTarget.style.background = 'var(--bg-hover)' }}
                          onMouseLeave={e => { if (settingsTab !== item.tab) e.currentTarget.style.background = 'transparent' }}>
                          <item.icon size={15} /> {item.label}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <SettingsPanel tab={settingsTab} onBack={() => setSettingsTab(null)} isMobile={false} />
                    </div>
                  </div>
                </div>
              )}
              {settingsTab && isMobile && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', flexShrink: 0 }}>
                    <div onClick={() => setSettingsTab(null)} style={{ display: 'flex', cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></div>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>设置</span>
                  </div>
                  <div style={{ display: 'flex', overflowX: 'auto', gap: 0, padding: '0 8px', borderBottom: '1px solid var(--border-secondary)', flexShrink: 0, WebkitOverflowScrolling: 'touch' } as any}>
                    {([
                      { icon: User, label: '个人信息', tab: 'profile' as const },
                      { icon: Shield, label: '账号安全', tab: 'account' as const },
                      { icon: Volume2, label: '声音', tab: 'sound' as const },
                      { icon: Palette, label: '外观', tab: 'appearance' as const },
                      { icon: Bell, label: '通知', tab: 'notification' as const },
                    ]).map(item => (
                      <div key={item.tab} onClick={() => setSettingsTab(item.tab)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '10px 12px', cursor: 'pointer',
                          fontSize: 13, fontWeight: settingsTab === item.tab ? 600 : 400, whiteSpace: 'nowrap',
                          color: settingsTab === item.tab ? 'var(--brand)' : 'var(--text-secondary)',
                          borderBottom: settingsTab === item.tab ? '2px solid var(--brand)' : '2px solid transparent',
                        }}>
                        <item.icon size={14} /> {item.label}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <SettingsPanel tab={settingsTab} onBack={() => setSettingsTab(null)} isMobile={true} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ===== Mobile 横向滚动导航栏 ===== */}
      {isMobile && (
        <nav style={{
          flexShrink: 0, background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-primary)',
          overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          display: 'flex', gap: 0, padding: '0 4px',
        } as any}>
          {NAV_ITEMS.map(item => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 2,
                  padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                  color: isActive ? 'var(--brand)' : 'var(--text-tertiary)',
                  borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                  fontSize: 10, fontWeight: isActive ? 600 : 500,
                  transition: 'color 0.15s',
                  position: 'relative',
                }}
                end={item.path === '/'}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.path === '/messaging' && dmUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    minWidth: 14, height: 14, borderRadius: 7, background: 'var(--color-danger)', color: '#fff',
                    fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>{dmUnread > 99 ? '99+' : dmUnread}</span>
                )}
              </NavLink>
            )
          })}
        </nav>
      )}

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

        {/* ===== 主内容区 ===== */}
        <main ref={mainRef} data-tour="main-content"
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
