import { useState } from 'react'
import { ArrowLeft, Edit2, Copy, Globe, Check } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import useThemeStore from '../../stores/useThemeStore'
import useI18nStore, { Locale } from '../../stores/useI18nStore'
import Avatar from './Avatar'
import Input from './Input'

const ROLE_LABELS: Record<string, string> = { admin: '管理员', manager: '经理', member: '成员' }

const NOTIF_ITEMS = [
  { key: 'notif_task_assign', label: '任务分配' },
  { key: 'notif_task_status', label: '任务状态' },
  { key: 'notif_project_update', label: '项目更新' },
  { key: 'notif_follow_reminder', label: '跟进提醒' },
  { key: 'notif_system', label: '系统通知' },
]

interface Props {
  tab: 'account' | 'appearance' | 'notification'
  onBack: () => void
}

export default function SettingsPanel({ tab, onBack }: Props) {
  const { user, updateProfile } = useUserStore()
  const { mode, setMode } = useThemeStore()
  const { locale, setLocale } = useI18nStore()
  const role = user?.role || 'member'

  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ nickname: '', email: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('notif_prefs'); if (s) return JSON.parse(s) } catch {}
    const d: Record<string, boolean> = {}; NOTIF_ITEMS.forEach(p => d[p.key] = true); return d
  })

  const toggleNotif = (key: string) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(next)
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

  const startProfileEdit = () => {
    if (user) setProfileForm({ nickname: user.nickname || '', email: user.email || '', phone: user.phone || '' })
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    const body: any = {}
    if (profileForm.nickname.trim() && profileForm.nickname.trim() !== (user?.nickname || '')) body.nickname = profileForm.nickname.trim()
    if (profileForm.email.trim() !== (user?.email || '')) body.email = profileForm.email.trim()
    if (profileForm.phone.trim() !== (user?.phone || '')) body.phone = profileForm.phone.trim()
    if (Object.keys(body).length === 0) return
    setSavingProfile(true)
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
    setSavingProfile(false)
    if (r.success) { updateProfile(r.data); setEditingProfile(false) }
  }

  if (!user) return null

  return (
    <div style={{
      width: 360, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
      borderRadius: '12px 0 0 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      overflow: 'hidden', borderRight: 'none',
      maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', cursor: 'pointer' }}
        onClick={() => { onBack(); setEditingProfile(false) }}>
        <ArrowLeft size={16} style={{ color: 'var(--text-tertiary)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
          {tab === 'account' ? '账号与安全' : tab === 'appearance' ? '外观与语言' : '通知偏好'}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        {tab === 'account' && (
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

        {tab === 'appearance' && (
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

        {tab === 'notification' && (
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
  )
}
