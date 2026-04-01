import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, ListTodo, Menu, X, LogOut, BarChart3, Shield, Settings, TrendingUp, MessageSquare, ScrollText, FileText, Building2, Ticket, Plug2, User, ChevronRight, ArrowLeft, Edit2, Check, Palette, Bell, Globe, Save, Loader2, Copy, Crown, ChevronDown, Plus, LogIn, UserCheck, CalendarDays, BellRing } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import useThemeStore from '../../stores/useThemeStore'
import useI18nStore, { Locale } from '../../stores/useI18nStore'
import { can } from '../../stores/permissions'
import { onSocket } from './smartSocket'
import Avatar from './Avatar'
import Input from './Input'
import useIsMobile from './useIsMobile'
import NotificationBell from './NotificationBell'
import CommandPalette from './CommandPalette'
import ProfileModal from './ProfileModal'
import ThemeToggle from './ThemeToggle'

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
  const { mode, setMode } = useThemeStore()
  const { locale, setLocale } = useI18nStore()
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
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) { setAvatarMenuOpen(false); setEntDropdownOpen(false) }
    }
    if (avatarMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarMenuOpen])

  // 路由切换时关闭头像菜单
  useEffect(() => { setAvatarMenuOpen(false); setSettingsTab(null); setEntDropdownOpen(false) }, [location.pathname])

  // 企业列表（头像下拉切换用）
  const [myEnterprises, setMyEnterprises] = useState<any[]>([])
  const [activeEntId, setActiveEntId] = useState<number | null>(null)
  const [entDropdownOpen, setEntDropdownOpen] = useState(false)

  const loadMyEnterprises = () => {
    fetchApi('/api/my-enterprise').then(r => {
      if (r.success && r.data) {
        setMyEnterprises(r.data.enterprises || [])
        setActiveEntId(r.data.activeId || null)
      }
    })
  }
  useEffect(() => { loadMyEnterprises() }, [])
  // 企业页面变动后刷新
  useEffect(() => { if (location.pathname === '/enterprise') loadMyEnterprises() }, [location.pathname])

  const switchEnterprise = (id: number) => {
    fetchApi('/api/my-enterprise/switch', { method: 'PUT', body: JSON.stringify({ enterprise_id: id }) }).then(r => {
      if (r.success) {
        setActiveEntId(id)
        setEntDropdownOpen(false)
        // 如果在企业页面则刷新
        if (location.pathname === '/enterprise') window.location.reload()
      }
    })
  }

  const ROLE_LABELS: Record<string, string> = { admin: '管理员', manager: '经理', member: '成员' }

  // 内联设置: 编辑表单
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ nickname: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const startProfileEdit = () => {
    if (user) setProfileForm({ nickname: user.nickname || '', email: user.email || '', phone: user.phone || '', password: '', confirmPassword: '' })
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    const body: any = {}
    if (profileForm.nickname.trim() && profileForm.nickname.trim() !== (user?.nickname || '')) body.nickname = profileForm.nickname.trim()
    if (profileForm.email.trim() !== (user?.email || '')) body.email = profileForm.email.trim()
    if (profileForm.phone.trim() !== (user?.phone || '')) body.phone = profileForm.phone.trim()
    if (profileForm.password) {
      if (profileForm.password.length < 6) return
      if (profileForm.password !== profileForm.confirmPassword) return
      body.password = profileForm.password
    }
    if (Object.keys(body).length === 0) return
    setSavingProfile(true)
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
    setSavingProfile(false)
    if (r.success) { updateProfile(r.data); setEditingProfile(false) }
  }

  // 通知偏好
  const NOTIF_ITEMS = [
    { key: 'notif_task_assign', label: '任务分配' },
    { key: 'notif_task_status', label: '任务状态' },
    { key: 'notif_project_update', label: '项目更新' },
    { key: 'notif_follow_reminder', label: '跟进提醒' },
    { key: 'notif_system', label: '系统通知' },
  ]
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('notif_prefs'); if (s) return JSON.parse(s) } catch {}
    const d: Record<string, boolean> = {}; NOTIF_ITEMS.forEach(p => d[p.key] = true); return d
  })
  const toggleNotif = (key: string) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(next)
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

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
                  {/* 左侧：设置面板（在下拉框左侧展开） */}
                  {settingsTab && (
                    <div style={{
                      width: 360, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                      borderRadius: '12px 0 0 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      overflow: 'hidden', borderRight: 'none',
                      maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
                    }}>
                      {/* 返回按钮 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', cursor: 'pointer' }}
                        onClick={() => { setSettingsTab(null); setEditingProfile(false) }}>
                        <ArrowLeft size={16} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
                          {settingsTab === 'account' ? '账号与安全' : settingsTab === 'appearance' ? '外观与语言' : '通知偏好'}
                        </span>
                      </div>

                      <div style={{ padding: 16 }}>
                        {/* --- 账号与安全 --- */}
                        {settingsTab === 'account' && (
                          <div>
                            {!editingProfile ? (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                  <Avatar name={user.nickname || user.username} size={48} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{user.nickname || user.username}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>@{user.username}</div>
                                  </div>
                                  <button onClick={startProfileEdit} style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Edit2 size={12} /> 编辑
                                  </button>
                                </div>
                                <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                                  <div><span style={{ color: 'var(--text-tertiary)' }}>昵称</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{user.nickname || '-'}</div></div>
                                  <div><span style={{ color: 'var(--text-tertiary)' }}>邮箱</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{user.email || '-'}</div></div>
                                  <div><span style={{ color: 'var(--text-tertiary)' }}>手机</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{user.phone || '-'}</div></div>
                                  <div><span style={{ color: 'var(--text-tertiary)' }}>角色</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{ROLE_LABELS[role] || role}</div></div>
                                  <div><span style={{ color: 'var(--text-tertiary)' }}>注册时间</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</div></div>
                                  <div><span style={{ color: 'var(--text-tertiary)' }}>用户ID</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{user.display_id || `#${user.id}`}</div></div>
                                </div>
                                {user.personal_invite_code && (
                                  <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-selected)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>邀请码</div>
                                    <code style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: 'var(--brand)', flex: 1 }}>{user.personal_invite_code}</code>
                                    <button onClick={() => { navigator.clipboard?.writeText(user.personal_invite_code || '') }}
                                      style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <Copy size={11} /> 复制
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <Input label="昵称" value={profileForm.nickname} onChange={e => setProfileForm({ ...profileForm, nickname: e.target.value })} />
                                <Input label="邮箱" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                                <Input label="手机" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                                <Input label="新密码" type="password" placeholder="不修改留空" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} />
                                {profileForm.password && <Input label="确认密码" type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                  <button onClick={() => setEditingProfile(false)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>取消</button>
                                  <button onClick={saveProfile} disabled={savingProfile} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                                    {savingProfile ? '保存中...' : '保存'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* --- 外观与语言 --- */}
                        {settingsTab === 'appearance' && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>主题模式</div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                              {([
                                { v: 'light' as const, l: '☀️ 浅色' },
                                { v: 'dark' as const, l: '🌙 深色' },
                                { v: 'system' as const, l: '💻 系统' },
                              ]).map(o => (
                                <div key={o.v} onClick={() => setMode(o.v)} style={{
                                  flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                                  border: mode === o.v ? '2px solid var(--brand)' : '2px solid var(--border-primary)',
                                  background: mode === o.v ? 'var(--bg-selected)' : 'transparent',
                                  fontSize: 12, fontWeight: mode === o.v ? 600 : 400,
                                  color: mode === o.v ? 'var(--brand)' : 'var(--text-secondary)',
                                }}>{o.l}</div>
                              ))}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>显示语言</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {([
                                { v: 'zh-CN' as Locale, l: '简体中文' },
                                { v: 'en-US' as Locale, l: 'English' },
                              ]).map(o => (
                                <div key={o.v} onClick={() => setLocale(o.v)} style={{
                                  flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                  border: locale === o.v ? '2px solid var(--brand)' : '2px solid var(--border-primary)',
                                  background: locale === o.v ? 'var(--bg-selected)' : 'transparent',
                                  fontSize: 12, fontWeight: locale === o.v ? 600 : 400,
                                  color: locale === o.v ? 'var(--brand)' : 'var(--text-secondary)',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                  <Globe size={14} /> {o.l}
                                  {locale === o.v && <Check size={12} style={{ marginLeft: 'auto', color: 'var(--brand)' }} />}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* --- 通知偏好 --- */}
                        {settingsTab === 'notification' && (
                          <div>
                            {NOTIF_ITEMS.map((p, i) => (
                              <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < NOTIF_ITEMS.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-heading)' }}>{p.label}</span>
                                <div onClick={() => toggleNotif(p.key)} style={{
                                  width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                                  background: notifPrefs[p.key] !== false ? 'var(--brand)' : 'var(--border-primary)',
                                  position: 'relative', transition: 'background 0.2s',
                                }}>
                                  <div style={{
                                    width: 16, height: 16, borderRadius: 8, background: '#fff',
                                    position: 'absolute', top: 2,
                                    left: notifPrefs[p.key] !== false ? 18 : 2,
                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                  }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{ROLE_LABELS[role] || role}</div>
                        </div>
                      </div>
                      {user.email && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
                    </div>

                    {/* 企业切换 */}
                    {myEnterprises.length > 0 && (() => {
                      const activeEnt = myEnterprises.find((e: any) => e.id === activeEntId)
                      return (
                        <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
                          <div style={{ position: 'relative' }}>
                            <div onClick={() => setEntDropdownOpen(!entDropdownOpen)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
                                background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}>
                              <Building2 size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {activeEnt?.name || '未选择企业'}
                                </div>
                                {activeEnt && (
                                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    {activeEnt.member_role === 'creator' && <Crown size={8} />}
                                    {activeEnt.member_role === 'admin' && <Shield size={8} />}
                                    {activeEnt.member_role === 'creator' ? '创建者' : activeEnt.member_role === 'admin' ? '管理员' : '成员'}
                                  </div>
                                )}
                              </div>
                              <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s', transform: entDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                            </div>

                            {entDropdownOpen && (
                              <div style={{
                                position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
                                background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 10, maxHeight: 200, overflowY: 'auto',
                              }}>
                                {myEnterprises.map((ent: any) => {
                                  const isActive = ent.id === activeEntId
                                  return (
                                    <div key={ent.id} onClick={() => { if (!isActive) switchEnterprise(ent.id) }}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                                        cursor: isActive ? 'default' : 'pointer', fontSize: 12,
                                        color: isActive ? 'var(--brand)' : 'var(--text-body)',
                                        background: isActive ? 'var(--bg-selected)' : 'transparent',
                                        fontWeight: isActive ? 600 : 400,
                                        transition: 'background 0.15s',
                                      }}
                                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                                      <Building2 size={12} style={{ color: isActive ? 'var(--brand)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ent.name}</span>
                                      <span style={{ fontSize: 10, color: isActive ? '#60a5fa' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {ent.member_role === 'creator' && <Crown size={8} />}
                                        {ent.member_role === 'admin' && <Shield size={8} />}
                                        {ent.member_role === 'creator' ? '创建者' : ent.member_role === 'admin' ? '管理员' : '成员'}
                                      </span>
                                      {isActive && <Check size={12} style={{ color: 'var(--brand)' }} />}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* 菜单项 */}
                    <div style={{ padding: '6px 0' }}>
                      {[
                        { icon: User, label: '账号与安全', tab: 'account' as const },
                        { icon: Palette, label: '外观与语言', tab: 'appearance' as const },
                        { icon: Bell, label: '通知偏好', tab: 'notification' as const },
                      ].map(item => (
                        <div key={item.tab} onClick={() => { setSettingsTab(settingsTab === item.tab ? null : item.tab); setEditingProfile(false) }}
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
