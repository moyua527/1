import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User, Shield, ChevronRight, ChevronLeft, ChevronDown, Palette, Bell, Settings, Search, HelpCircle, Volume2, Home, Star, FolderKanban, LayoutGrid } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import { can } from '../../stores/permissions'
import { onSocket, setSocketUserId, startSSE, stopSSE } from './smartSocket'
import Avatar from './Avatar'
import useIsMobile from './useIsMobile'
import NotificationBell from './NotificationBell'
import CommandPalette from './CommandPalette'
import ProfileModal from './ProfileModal'
import { popModalClose } from './Modal'
import ThemeToggle from './ThemeToggle'
import SettingsPanel from './SettingsPanel'
import EnterpriseSwitcher from './EnterpriseSwitcher'
import { isCapacitor } from '../../utils/capacitor'
import UserGuide from './UserGuide'
import OnboardingChecklist from './OnboardingChecklist'
import { navItems, navItemsByGroup } from '../../data/routeManifest'

const SIDEBAR_W = 228
const SIDEBAR_COLLAPSED_W = 68

function SidebarItem({ item, isActive, sidebarCollapsed, dmUnread, isFav, onToggleFav, onClick }: {
  item: { path: string; label: string; icon: React.ComponentType<any> }
  isActive: boolean; sidebarCollapsed: boolean; dmUnread: number
  isFav: boolean; onToggleFav: () => void; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      title={sidebarCollapsed ? item.label : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: sidebarCollapsed ? '10px 0' : '8px 10px',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        borderRadius: 8, cursor: 'pointer', marginBottom: 2,
        color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
        background: isActive ? 'var(--bg-selected)' : hovered ? 'var(--bg-hover)' : 'transparent',
        fontWeight: isActive ? 600 : 500, fontSize: 13,
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <item.icon size={18} style={{ flexShrink: 0 }} />
      {!sidebarCollapsed && (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      )}
      {item.path === '/messaging' && dmUnread > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-danger)', color: '#fff',
          fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', position: sidebarCollapsed ? 'absolute' : 'static',
          top: sidebarCollapsed ? 4 : undefined, right: sidebarCollapsed ? 8 : undefined,
        }}>{dmUnread > 99 ? '99+' : dmUnread}</span>
      )}
      {!sidebarCollapsed && hovered && (
        <span
          onClick={e => { e.stopPropagation(); onToggleFav() }}
          title={isFav ? '取消收藏' : '添加收藏'}
          style={{
            display: 'flex', alignItems: 'center', padding: 2, borderRadius: 4, cursor: 'pointer',
            color: isFav ? '#f59e0b' : 'var(--text-tertiary)',
            transition: 'color 0.15s',
          }}>
          <Star size={13} style={isFav ? { fill: '#f59e0b' } : undefined} />
        </span>
      )}
      {!sidebarCollapsed && !hovered && isFav && (
        <span style={{ display: 'flex', alignItems: 'center', padding: 2, color: '#f59e0b' }}>
          <Star size={13} style={{ fill: '#f59e0b' }} />
        </span>
      )}
    </div>
  )
}

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
  const prevPathRef = useRef(location.pathname)
  const pageAnimRef = useRef('')
  const lastClickXRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isMobile) return
    const handler = (e: MouseEvent | TouchEvent) => {
      const nav = (e.target as HTMLElement).closest('[data-tour="mobile-nav"]')
      if (nav) { lastClickXRef.current = null; return }
      const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX
      if (x != null) lastClickXRef.current = x
    }
    document.addEventListener('click', handler, true)
    document.addEventListener('touchstart', handler, true)
    return () => {
      document.removeEventListener('click', handler, true)
      document.removeEventListener('touchstart', handler, true)
    }
  }, [isMobile])
  const role = user?.role || 'member'
  const NAV_ITEMS = navItems().filter(n => !n.perm || can(role, n.perm))

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed_groups')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [favPaths, setFavPaths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sidebar_favorites')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      localStorage.setItem('sidebar_collapsed_groups', JSON.stringify([...next]))
      return next
    })
  }

  const toggleFav = (path: string) => {
    setFavPaths(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
      localStorage.setItem('sidebar_favorites', JSON.stringify(next))
      return next
    })
  }

  const groups = navItemsByGroup(NAV_ITEMS)
  const favItems = NAV_ITEMS.filter(n => favPaths.includes(n.path))
  const currentNav = NAV_ITEMS.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))
  

  

  if (isMobile && prevPathRef.current !== location.pathname) {
    const prev = prevPathRef.current
    const tabPages = ['/', '/projects', '/services']
    const wasTab = tabPages.includes(prev)
    const isTab = tabPages.includes(location.pathname)
    if (wasTab && isTab) {
      pageAnimRef.current = ''
    } else if (lastClickXRef.current != null) {
      const mid = window.innerWidth / 2
      pageAnimRef.current = lastClickXRef.current >= mid ? 'page-slide-right' : 'page-slide-left'
    } else if (isTab && !wasTab) {
      pageAnimRef.current = 'page-slide-left'
    } else {
      pageAnimRef.current = 'page-slide-right'
    }
    lastClickXRef.current = null
    prevPathRef.current = location.pathname
  }

  useEffect(() => {
    if (!user?.id) return
    if (user.guide_done) return
    const localKey = `guide_done_${user.id}`
    if (localStorage.getItem(localKey)) return
    const t = setTimeout(() => setGuideOpen(true), 800)
    return () => clearTimeout(t)
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

  // 左边缘右滑返回手势（微信风格）
  const swipeOverlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isMobile) return
    const mainPages = ['/', '/projects', '/services']
    let startX = 0, startY = 0, tracking = false, confirmed = false

    const onTouchStart = (e: TouchEvent) => {
      if (mainPages.includes(location.pathname)) return
      const t = e.touches[0]
      if (t.clientX > 28) return
      startX = t.clientX; startY = t.clientY; tracking = true; confirmed = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      const t = e.touches[0]
      const dx = t.clientX - startX, dy = t.clientY - startY
      if (!confirmed && Math.abs(dy) > Math.abs(dx)) { tracking = false; return }
      if (dx > 12) confirmed = true
      if (confirmed) {
        e.preventDefault()
        const pct = Math.min(dx / window.innerWidth, 1)
        if (swipeOverlayRef.current) {
          swipeOverlayRef.current.style.opacity = String(Math.min(pct * 1.5, 0.35))
          swipeOverlayRef.current.style.display = 'block'
        }
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking || !confirmed) { tracking = false; if (swipeOverlayRef.current) swipeOverlayRef.current.style.display = 'none'; return }
      const dx = (e.changedTouches[0]?.clientX || 0) - startX
      tracking = false; confirmed = false
      if (swipeOverlayRef.current) swipeOverlayRef.current.style.display = 'none'
      if (dx > 80) {
        if (!popModalClose()) {
          const path = location.pathname
          const parent = path.replace(/\/[^/]+\/?$/, '') || '/'
          navigate(parent)
        }
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, location.pathname, navigate])

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
      if (isCapacitor) return
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

      {/* ===== 顶栏 56px (PC only) ===== */}
      <header style={{
        height: 56, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)',
        display: isMobile ? 'none' : 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 100,
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
              {/* Favorites section */}
              {favItems.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {!sidebarCollapsed && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                      color: 'var(--text-tertiary)', padding: '4px 10px', letterSpacing: '0.05em',
                    }}>
                      <Star size={11} style={{ fill: 'var(--text-tertiary)' }} />
                      <span>收藏</span>
                    </div>
                  )}
                  {favItems.map(item => {
                    const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                    return (
                      <SidebarItem key={`fav-${item.path}`} item={item} isActive={isActive}
                        sidebarCollapsed={sidebarCollapsed} dmUnread={dmUnread}
                        isFav onToggleFav={() => toggleFav(item.path)}
                        onClick={() => navigate(item.path)} />
                    )
                  })}
                </div>
              )}
              {groups.map((g, gi) => {
                const isGroupCollapsed = collapsedGroups.has(g.key)
                return (
                <div key={g.key} style={{ marginTop: (gi === 0 && favItems.length === 0) ? 0 : gi === 0 ? 0 : 12 }}>
                  {!sidebarCollapsed && (
                    <div onClick={() => toggleGroup(g.key)}
                      style={{
                        display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600,
                        color: 'var(--text-tertiary)', padding: '4px 10px', letterSpacing: '0.05em',
                        cursor: 'pointer', userSelect: 'none', borderRadius: 4,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                      <span style={{ flex: 1 }}>{g.label}</span>
                      <span style={{
                        display: 'flex', alignItems: 'center',
                        transform: isGroupCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}>
                        <ChevronDown size={12} />
                      </span>
                    </div>
                  )}
                  <div style={{
                    overflow: 'hidden',
                    maxHeight: (sidebarCollapsed || !isGroupCollapsed) ? 500 : 0,
                    opacity: (sidebarCollapsed || !isGroupCollapsed) ? 1 : 0,
                    transition: 'max-height 0.25s ease, opacity 0.2s ease',
                  }}>
                    {g.items.map(item => {
                      const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                      return (
                        <SidebarItem key={item.path} item={item} isActive={isActive}
                          sidebarCollapsed={sidebarCollapsed} dmUnread={dmUnread}
                          isFav={favPaths.includes(item.path)} onToggleFav={() => toggleFav(item.path)}
                          onClick={() => navigate(item.path)} />
                      )
                    })}
                  </div>
                </div>
                )
              })}
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
          style={{
            flex: 1, minHeight: 0, position: 'relative',
            ...(isMobile && ['/', '/projects', '/services'].includes(location.pathname)
              ? { overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' as const }
              : { overflow: 'auto', padding: isMobile ? '20px 16px' : 24, paddingBottom: isMobile ? 'max(32px, env(safe-area-inset-bottom, 32px))' : 24, WebkitOverflowScrolling: 'touch' as any, overscrollBehavior: 'contain' }
            ),
          }}>
          {isMobile && (ptrY > 0 || ptrRefreshing) && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
              display: 'flex', justifyContent: 'center', paddingTop: Math.max(ptrY - 30, 4),
              pointerEvents: 'none',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #e5e7eb', borderTopColor: 'var(--brand)',
                background: 'var(--bg-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: ptrRefreshing ? 'ptr-spin .7s linear infinite' : 'none',
                transform: ptrRefreshing ? 'none' : `rotate(${Math.min(ptrY / 55, 1) * 360}deg)`,
                opacity: Math.min(ptrY / 30, 1),
              }} />
            </div>
          )}
          {isMobile && pageAnimRef.current ? (
            <div key={location.pathname} className={pageAnimRef.current} style={{ willChange: 'transform, opacity', flex: 1, display: 'flex', flexDirection: 'column' as const, minHeight: 0 }}>
              <Outlet context={{
                user, isMobile, dmUnread,
                openSettings: (tab: string) => setSettingsTab(tab as any),
                openProfile: () => setProfileOpen(true),
                openGuide: () => setGuideOpen(true),
              }} />
            </div>
          ) : (
            <Outlet context={{
              user, isMobile, dmUnread,
              openSettings: (tab: string) => setSettingsTab(tab as any),
              openProfile: () => setProfileOpen(true),
              openGuide: () => setGuideOpen(true),
            }} />
          )}
          {isMobile && <style>{`
            @keyframes ptr-spin{to{transform:rotate(360deg)}}
            @keyframes pageSlideRight{from{transform:translateX(28%);opacity:.4}to{transform:translateX(0);opacity:1}}
            @keyframes pageSlideLeft{from{transform:translateX(-28%);opacity:.4}to{transform:translateX(0);opacity:1}}
            @keyframes pageFade{from{opacity:.5}to{opacity:1}}
            .page-slide-right{animation:pageSlideRight .26s cubic-bezier(.25,.46,.45,.94)}
            .page-slide-left{animation:pageSlideLeft .26s cubic-bezier(.25,.46,.45,.94)}
            .page-fade{animation:pageFade .2s ease}
          `}</style>}
        </main>
      </div>

      {/* ===== Mobile 底部导航栏（仅主页面显示） ===== */}
      {isMobile && ['/', '/projects', '/services'].includes(location.pathname) && (
        <nav data-tour="mobile-nav" style={{
          flexShrink: 0, background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex', justifyContent: 'space-around', padding: '6px 0 env(safe-area-inset-bottom, 6px)',
          zIndex: 100, WebkitTouchCallout: 'none', userSelect: 'none',
        }} onContextMenu={e => e.preventDefault()}>
          <NavLink to="/" end data-tour="mobile-home"
            style={{
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 2,
              padding: '4px 0', textDecoration: 'none', flex: 1,
              color: location.pathname === '/' ? 'var(--brand)' : 'var(--text-tertiary)',
              fontSize: 11, fontWeight: location.pathname === '/' ? 600 : 400,
            }}>
            <Home size={22} />
            <span>首页</span>
          </NavLink>
          <NavLink to="/projects" data-tour="mobile-projects"
            style={{
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 2,
              padding: '4px 0', textDecoration: 'none', flex: 1,
              color: location.pathname.startsWith('/projects') ? 'var(--brand)' : 'var(--text-tertiary)',
              fontSize: 11, fontWeight: location.pathname.startsWith('/projects') ? 600 : 400,
            }}>
            <FolderKanban size={22} />
            <span>项目</span>
          </NavLink>
          <NavLink to="/services" data-tour="mobile-services"
            style={{
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 2,
              padding: '4px 0', textDecoration: 'none', flex: 1,
              color: location.pathname === '/services' ? 'var(--brand)' : 'var(--text-tertiary)',
              fontSize: 11, fontWeight: location.pathname === '/services' ? 600 : 400,
            }}>
            <LayoutGrid size={22} />
            <span>服务</span>
          </NavLink>
        </nav>
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
      {/* 滑动返回视觉遮罩 */}
      {isMobile && <div ref={swipeOverlayRef} style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, pointerEvents: 'none', transition: 'opacity 0.05s' }} />}

      <UserGuide open={guideOpen} onClose={() => {
        setGuideOpen(false)
        if (user) {
          localStorage.setItem(`guide_done_${user.id}`, '1')
          fetchApi('/api/auth/guide-done', { method: 'POST' }).catch(() => {})
        }
      }} />
      <OnboardingChecklist />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onProfileUpdated={updateProfile} />
    </div>
  )
}
