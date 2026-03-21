import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, ListTodo, Menu, X, LogOut, BarChart3, Shield, Settings } from 'lucide-react'
import { fetchApi, clearToken } from '../../bootstrap'
import Avatar from './Avatar'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { toast } from './Toast'

const ALL_NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard, roles: ['admin', 'member', 'client'] },
  { path: '/projects', label: '项目管理', icon: FolderKanban, roles: ['admin', 'member', 'client'] },
  { path: '/clients', label: '客户管理', icon: Users, roles: ['admin', 'member'] },
  { path: '/tasks', label: '任务看板', icon: ListTodo, roles: ['admin', 'member'] },
  { path: '/report', label: '数据报表', icon: BarChart3, roles: ['admin', 'member'] },
  { path: '/users', label: '用户管理', icon: Shield, roles: ['admin'] },
]

const roleLabel: Record<string, string> = { admin: '管理员', member: '成员', client: '客户' }

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
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ nickname: '', password: '', confirmPassword: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const location = useLocation()
  const role = user?.role || 'member'
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(n => n.roles.includes(role))
  const currentNav = NAV_ITEMS.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))

  useEffect(() => { fetchApi('/api/auth/me').then(r => { if (r.success) setUser(r.data) }) }, [])

  const openProfile = () => {
    if (user) setProfileForm({ nickname: user.nickname || '', password: '', confirmPassword: '' })
    setProfileOpen(true)
  }

  const handleProfileSave = async () => {
    const body: any = {}
    if (profileForm.nickname.trim() && profileForm.nickname.trim() !== user?.nickname) body.nickname = profileForm.nickname.trim()
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

  return (
    <div style={s.wrapper}>
      <aside style={collapsed ? { ...s.sidebar, ...s.sidebarCollapsed } : s.sidebar}>
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
      </aside>
      <div style={s.main}>
        <header style={s.header}>
          <button style={s.menuBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
          <span style={s.headerTitle}>{currentNav?.label || 'DuiJie'}</span>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{user.nickname}</span>
            </div>
          )}
        </header>
        <main style={s.content}>
          <Outlet context={{ user }} />
        </main>
      </div>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="个人信息设置">
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
              <Avatar name={user.nickname || user.username} size={56} />
              <div style={{ fontSize: 12, color: '#94a3b8' }}>@{user.username} · {roleLabel[user.role] || user.role}</div>
            </div>
            <Input label="昵称" placeholder="输入新昵称" value={profileForm.nickname} onChange={e => setProfileForm({ ...profileForm, nickname: e.target.value })} />
            <Input label="新密码（不修改请留空）" placeholder="至少6位" type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} />
            {profileForm.password && (
              <Input label="确认密码" placeholder="再次输入新密码" type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setProfileOpen(false)}>取消</Button>
              <Button onClick={handleProfileSave} disabled={profileSaving}>{profileSaving ? '保存中...' : '保存'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
