import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, ListTodo, Menu, X, LogOut, BarChart3, Shield, Settings, Copy, TrendingUp, MessageSquare } from 'lucide-react'
import { fetchApi, clearToken } from '../../bootstrap'
import Avatar from './Avatar'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { toast } from './Toast'
import useIsMobile from './useIsMobile'

const ALL_NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard, roles: ['admin', 'tech', 'business', 'member'] },
  { path: '/projects', label: '项目管理', icon: FolderKanban, roles: ['admin', 'tech', 'business', 'member'] },
  { path: '/clients', label: '客户管理', icon: Users, roles: ['admin', 'business'] },
  { path: '/opportunities', label: '商机管理', icon: TrendingUp, roles: ['admin', 'business'] },
  { path: '/tasks', label: '任务看板', icon: ListTodo, roles: ['admin', 'tech', 'business', 'member'] },
  { path: '/messaging', label: '站内消息', icon: MessageSquare, roles: ['admin', 'tech', 'business', 'member'] },
  { path: '/report', label: '数据报表', icon: BarChart3, roles: ['admin', 'business'] },
  { path: '/users', label: '用户管理', icon: Shield, roles: ['admin'] },
]

const roleLabel: Record<string, string> = { admin: '管理人员', tech: '技术人员', business: '业务人员', member: '普通成员' }

const s = {
  wrapper: { display: 'flex', height: '100vh', background: '#f1f5f9', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" } as React.CSSProperties,
  sidebar: { width: 240, background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s' } as React.CSSProperties,
  sidebarCollapsed: { width: 0, overflow: 'hidden', borderRight: 'none' } as React.CSSProperties,
  logo: { padding: '20px 24px', fontSize: 20, fontWeight: 700, color: '#1e40af', borderBottom: '1px solid #e2e8f0', letterSpacing: -0.5 } as React.CSSProperties,
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 } as React.CSSProperties,
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' } as React.CSSProperties,
  navItemActive: { background: '#eff6ff', color: '#2563eb', fontWeight: 600 } as React.CSSProperties,
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } as React.CSSProperties,
  header: { height: 56, background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 } as React.CSSProperties,
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b', display: 'flex', alignItems: 'center' } as React.CSSProperties,
  headerTitle: { fontSize: 16, fontWeight: 600, color: '#0f172a', flex: 1 } as React.CSSProperties,
  content: { flex: 1, overflow: 'auto', padding: 24 } as React.CSSProperties,
  userArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #e2e8f0' } as React.CSSProperties,
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4, marginLeft: 'auto' } as React.CSSProperties,
}

export default function Layout() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ nickname: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const location = useLocation()
  const role = user?.role || 'member'
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(n => n.roles.includes(role))
  const currentNav = NAV_ITEMS.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))

  useEffect(() => { setCollapsed(isMobile) }, [isMobile])
  useEffect(() => { if (isMobile) setCollapsed(true) }, [location.pathname, isMobile])
  useEffect(() => { fetchApi('/api/auth/me').then(r => { if (r.success) setUser(r.data) }) }, [])

  const openProfile = () => {
    if (user) setProfileForm({ nickname: user.nickname || '', email: user.email || '', phone: user.phone || '', password: '', confirmPassword: '' })
    setProfileOpen(true)
  }

  const handleProfileSave = async () => {
    const body: any = {}
    if (profileForm.nickname.trim() && profileForm.nickname.trim() !== (user?.nickname || '')) body.nickname = profileForm.nickname.trim()
    if (profileForm.email.trim() !== (user?.email || '')) body.email = profileForm.email.trim()
    if (profileForm.phone.trim() !== (user?.phone || '')) body.phone = profileForm.phone.trim()
    if (profileForm.password) {
      if (profileForm.password.length < 6) { toast('密码至少6位', 'error'); return }
      if (profileForm.password !== profileForm.confirmPassword) { toast('两次密码不一致', 'error'); return }
      body.password = profileForm.password
    }
    if (Object.keys(body).length === 0) { toast('没有需要更新的内容', 'error'); return }
    setProfileSaving(true)
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
    setProfileSaving(false)
    if (r.success) { toast('个人信息已更新', 'success'); setUser(r.data); setProfileOpen(false) }
    else toast(r.message || '更新失败', 'error')
  }

  const handleLogout = async () => {
    await fetchApi('/api/auth/logout', { method: 'POST' })
    clearToken()
    window.location.reload()
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
            style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}
            end={item.path === '/'}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div style={s.userArea}>
          <div onClick={openProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
            title="点击编辑个人信息">
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
      {isMobile ? (
        <>
          {sidebarOpen && <div onClick={() => setCollapsed(true)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, transition: 'opacity 0.2s' }} />}
          <aside style={{ ...s.sidebar, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', boxShadow: sidebarOpen ? '4px 0 16px rgba(0,0,0,0.1)' : 'none', width: 260 }}>
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
          <button style={s.menuBtn} onClick={() => setCollapsed(!collapsed)}>
            {sidebarOpen && !isMobile ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={s.headerTitle}>{currentNav?.label || 'DuiJie'}</span>
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

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="个人信息设置">
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
              <Avatar name={user.nickname || user.username} size={64} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{user.nickname || user.username}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>@{user.username}</div>
                {user.display_id && <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: 0.5, marginTop: 2 }}>ID: {user.display_id}</div>}
                <div style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#2563eb', fontWeight: 500, marginTop: 4 }}>{roleLabel[user.role] || user.role}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>基本信息</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input label="昵称" placeholder="输入昵称" value={profileForm.nickname} onChange={e => setProfileForm({ ...profileForm, nickname: e.target.value })} />
                <Input label="邮箱" placeholder="your@email.com" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                <Input label="手机号" placeholder="输入手机号" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>账号信息</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                <div><span style={{ color: '#94a3b8' }}>用户名</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.username}</div></div>
                <div><span style={{ color: '#94a3b8' }}>角色</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{roleLabel[user.role] || user.role}</div></div>
                <div><span style={{ color: '#94a3b8' }}>注册时间</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</div></div>
                <div><span style={{ color: '#94a3b8' }}>用户ID</span><div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>#{user.id}</div></div>
              </div>
            </div>

            {user.personal_invite_code && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>我的专属邀请码</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', borderRadius: 10, border: '1px solid #e0e7ff' }}>
                <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: '#1e40af', flex: 1 }}>{user.personal_invite_code}</code>
                <button onClick={() => { try { const t = document.createElement('textarea'); t.value = user.personal_invite_code; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); } catch {} toast('邀请码已复制', 'success') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid #c7d2fe', background: '#fff', color: '#4f46e5', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  <Copy size={14} /> 复制
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>分享此邀请码给新用户，对方注册后将自动成为你的客户</div>
            </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>安全设置</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input label="新密码（不修改请留空）" placeholder="至少6位" type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} />
                {profileForm.password && (
                  <Input label="确认密码" placeholder="再次输入新密码" type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
              <Button variant="secondary" onClick={() => setProfileOpen(false)}>取消</Button>
              <Button onClick={handleProfileSave} disabled={profileSaving}>{profileSaving ? '保存中...' : '保存修改'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
