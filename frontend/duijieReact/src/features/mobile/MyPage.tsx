import { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { LogOut, Palette, HelpCircle, ChevronRight, Shield, Info } from 'lucide-react'
import useUserStore from '../../stores/useUserStore'
import Avatar from '../ui/Avatar'
import EnterpriseSwitcher from '../ui/EnterpriseSwitcher'
import { APP_VERSION } from '../../utils/capacitor'

interface LayoutContext {
  user: any
  isMobile: boolean
  openGuide: () => void
}

export default function MyPage() {
  const { user, openGuide } = useOutletContext<LayoutContext>()
  const navigate = useNavigate()
  const { logout } = useUserStore()
  const [confirmGuide, setConfirmGuide] = useState(false)
  const role = user?.role || 'member'

  if (!user) return null

  const menuItems = [
    { icon: Shield, label: '账号与安全', action: () => navigate('/user-settings?tab=account') },
    { icon: Palette, label: '外观与语言', action: () => navigate('/user-settings?tab=appearance') },
    { icon: HelpCircle, label: '新手引导', action: () => setConfirmGuide(true) },
  ]

  return (
    <div style={{ minHeight: 'calc(100dvh - 68px)' }}>
      <div onClick={() => navigate('/user-settings?tab=account')}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: 16, marginBottom: 12,
          background: 'var(--bg-primary)', borderRadius: 16, cursor: 'pointer',
        }}>
        <Avatar name={user.nickname || user.username} size={56} src={user.avatar || undefined} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>
            {user.nickname || user.username}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>
            {user.email || (role === 'admin' ? '管理员' : '成员')}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
      </div>

      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
        <EnterpriseSwitcher />
      </div>

      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden' }}>
        {menuItems.map((item, i) => (
          <div key={item.label} onClick={item.action}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer',
              borderBottom: i < menuItems.length - 1 ? '1px solid var(--border-secondary)' : 'none',
            }}>
            <item.icon size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)' }}>{item.label}</span>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ))}
      </div>

      <div onClick={() => navigate('/about')} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', marginTop: 12,
        background: 'var(--bg-primary)', borderRadius: 16, cursor: 'pointer',
      }}>
        <Info size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)' }}>版本信息</span>
        <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>v{APP_VERSION}</span>
        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
      </div>

      <div onClick={logout}
        style={{
          marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: 16, borderRadius: 16, background: 'var(--bg-primary)', cursor: 'pointer',
          color: 'var(--color-danger)', fontSize: 15, fontWeight: 500,
        }}>
        <LogOut size={16} />
        退出登录
      </div>

      {confirmGuide && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmGuide(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: 280, background: 'var(--bg-primary)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <HelpCircle size={36} style={{ color: 'var(--brand)', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>新手引导</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>将为你展示主要功能的使用方法，是否开始？</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmGuide(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={() => { setConfirmGuide(false); openGuide() }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                开始引导
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
