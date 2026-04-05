import { useState } from 'react'
import { ArrowLeft, Globe, Check, Volume2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import useThemeStore from '../../stores/useThemeStore'
import useI18nStore, { Locale } from '../../stores/useI18nStore'
import Input from './Input'
import { playNotificationSound } from '../../utils/notificationSound'

const NOTIF_ITEMS = [
  { key: 'notif_task_assign', label: '需求分配' },
  { key: 'notif_task_status', label: '需求状态' },
  { key: 'notif_project_update', label: '项目更新' },
  { key: 'notif_follow_reminder', label: '跟进提醒' },
  { key: 'notif_system', label: '系统通知' },
]

const SOUND_ITEMS = [
  { key: 'sound_message', label: '项目消息' },
  { key: 'sound_dm', label: '私信' },
  { key: 'sound_notification', label: '系统通知' },
  { key: 'sound_task', label: '新需求' },
]

function getSoundPrefs(): Record<string, boolean> {
  try { const s = localStorage.getItem('sound_prefs'); if (s) return JSON.parse(s) } catch {}
  const d: Record<string, boolean> = {}; SOUND_ITEMS.forEach(p => d[p.key] = true); return d
}

export function isSoundEnabled(key: string): boolean {
  return getSoundPrefs()[key] !== false
}

interface Props {
  tab: 'account' | 'sound' | 'appearance' | 'notification'
  onBack: () => void
  isMobile?: boolean
}

export default function SettingsPanel({ tab, onBack, isMobile }: Props) {
  const { user } = useUserStore()
  const { mode, setMode } = useThemeStore()
  const { locale, setLocale } = useI18nStore()

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const [soundPrefs, setSoundPrefs] = useState<Record<string, boolean>>(getSoundPrefs)
  const [soundVolume, setSoundVolume] = useState(() => {
    try { return Number(localStorage.getItem('sound_volume') ?? 100) } catch { return 100 }
  })

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('notif_prefs'); if (s) return JSON.parse(s) } catch {}
    const d: Record<string, boolean> = {}; NOTIF_ITEMS.forEach(p => d[p.key] = true); return d
  })

  const toggleSound = (key: string) => {
    const next = { ...soundPrefs, [key]: !soundPrefs[key] }
    setSoundPrefs(next)
    localStorage.setItem('sound_prefs', JSON.stringify(next))
  }

  const handleVolumeChange = (v: number) => {
    setSoundVolume(v)
    localStorage.setItem('sound_volume', String(v))
  }

  const toggleNotif = (key: string) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(next)
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

  const handleChangePw = async () => {
    setPwMsg('')
    if (!pwForm.newPw) { setPwMsg('请输入新密码'); return }
    if (pwForm.newPw.length < 8) { setPwMsg('密码至少 8 位'); return }
    if (!/[a-zA-Z]/.test(pwForm.newPw) || !/[0-9]/.test(pwForm.newPw)) { setPwMsg('密码需含字母和数字'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('两次密码不一致'); return }
    setPwSaving(true)
    const r = await fetchApi('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }) })
    setPwSaving(false)
    if (r.success) { setPwMsg('密码修改成功'); setPwForm({ current: '', newPw: '', confirm: '' }) }
    else setPwMsg(r.message || '修改失败')
  }

  if (!user) return null

  return (
    <div style={{
      width: isMobile ? '100%' : 360, background: 'var(--bg-primary)',
      border: isMobile ? 'none' : '1px solid var(--border-primary)',
      borderRadius: isMobile ? 0 : '12px 0 0 12px',
      boxShadow: isMobile ? 'none' : '0 8px 24px rgba(0,0,0,0.12)',
      overflow: 'hidden', borderRight: 'none',
      maxHeight: isMobile ? '100%' : 'calc(100vh - 80px)', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', cursor: 'pointer' }}
        onClick={() => onBack()}>
        <ArrowLeft size={16} style={{ color: 'var(--text-tertiary)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
          {tab === 'account' ? '账号与安全' : tab === 'sound' ? '声音设置' : tab === 'appearance' ? '外观与语言' : '通知偏好'}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        {tab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 10 }}>修改密码</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Input label="当前密码" type="password" placeholder="输入当前密码" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
                <Input label="新密码" type="password" placeholder="至少8位，含字母和数字" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} />
                <Input label="确认新密码" type="password" placeholder="再次输入新密码" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                {pwMsg && <div style={{ fontSize: 12, color: pwMsg === '密码修改成功' ? 'var(--color-success)' : 'var(--color-danger)' }}>{pwMsg}</div>}
                <button onClick={handleChangePw} disabled={pwSaving}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-end', opacity: pwSaving ? 0.6 : 1 }}>
                  {pwSaving ? '修改中...' : '修改密码'}
                </button>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>账号信息</div>
              <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                <div><span style={{ color: 'var(--text-tertiary)' }}>用户名</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{user.username}</div></div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>注册时间</span><div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</div></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'sound' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>音量</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Volume2 size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <input type="range" min={0} max={100} value={soundVolume} onChange={e => handleVolumeChange(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--brand)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>{soundVolume}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => playNotificationSound()}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                试听提示音
              </button>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>提示音开关</div>
            {SOUND_ITEMS.map((p, i) => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < SOUND_ITEMS.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--text-heading)' }}>{p.label}</span>
                <div onClick={() => toggleSound(p.key)} style={{
                  width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                  background: soundPrefs[p.key] !== false ? 'var(--brand)' : 'var(--border-primary)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 8, background: '#fff',
                    position: 'absolute', top: 2,
                    left: soundPrefs[p.key] !== false ? 18 : 2,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            ))}
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
