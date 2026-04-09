import { useState } from 'react'
import { X, Globe, Check, Volume2, Mail, Phone, Hash, Key, Lock, ChevronRight, ArrowLeft } from 'lucide-react'
import Avatar from './Avatar'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import useThemeStore from '../../stores/useThemeStore'
import Input from './Input'
import { playNotificationSound } from '../../utils/notificationSound'
import { isCapacitor } from '../../utils/capacitor'

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

function SettingRow({ icon, label, value, onClick, last }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void; last?: boolean }) {
  return (
    <div onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
        borderBottom: last ? 'none' : '1px solid var(--border-secondary)',
      }}>
      <div style={{ color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0 }}>{icon}</div>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-heading)' }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: 'var(--text-tertiary)', flexShrink: 0 }}>{value}</span>}
      {onClick && <ChevronRight size={16} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />}
    </div>
  )
}

function GestureLockSettings({ onBack }: { onBack: () => void }) {
  const hasLock = !!localStorage.getItem('gesture_lock_hash')
  const [phase, setPhase] = useState<'menu' | 'set' | 'verify-off'>('menu')
  const [firstPattern, setFirstPattern] = useState<number[] | null>(null)
  const [error, setError] = useState('')

  const handlePatternComplete = (pattern: number[]) => {
    if (pattern.length < 4) { setError('至少连接4个点'); return }
    if (phase === 'set' && !firstPattern) {
      setFirstPattern(pattern)
      setError('')
      return
    }
    if (phase === 'set' && firstPattern) {
      if (pattern.join(',') === firstPattern.join(',')) {
        localStorage.setItem('gesture_lock_hash', hashPattern(pattern))
        setPhase('menu')
        setFirstPattern(null)
        setError('')
      } else {
        setError('两次手势不一致，请重新设置')
        setFirstPattern(null)
      }
      return
    }
    if (phase === 'verify-off') {
      const stored = localStorage.getItem('gesture_lock_hash')
      if (stored === hashPattern(pattern)) {
        localStorage.removeItem('gesture_lock_hash')
        setPhase('menu')
        setError('')
      } else {
        setError('手势不正确')
      }
    }
  }

  if (phase === 'set') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16 }}>
        <div onClick={() => { setPhase('menu'); setFirstPattern(null); setError('') }} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={16} /> 返回
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
          {firstPattern ? '再次绘制手势以确认' : '绘制解锁手势'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24 }}>至少连接4个点</div>
        {error && <div style={{ fontSize: 13, color: 'var(--color-danger, #ef4444)', marginBottom: 12 }}>{error}</div>}
        <PatternGrid onComplete={handlePatternComplete} key={firstPattern ? 'confirm' : 'first'} />
      </div>
    )
  }

  if (phase === 'verify-off') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16 }}>
        <div onClick={() => { setPhase('menu'); setError('') }} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={16} /> 返回
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>验证当前手势</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24 }}>请绘制当前手势以关闭</div>
        {error && <div style={{ fontSize: 13, color: 'var(--color-danger, #ef4444)', marginBottom: 12 }}>{error}</div>}
        <PatternGrid onComplete={handlePatternComplete} />
      </div>
    )
  }

  return (
    <div>
      <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
        <ArrowLeft size={16} /> 返回
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 16 }}>手势解锁</div>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden' }}>
        {hasLock ? (
          <>
            <SettingRow icon={<Lock size={18} />} label="修改手势" onClick={() => { setPhase('set'); setFirstPattern(null); setError('') }} />
            <SettingRow icon={<X size={18} />} label="关闭手势解锁" onClick={() => { setPhase('verify-off'); setError('') }} last />
          </>
        ) : (
          <SettingRow icon={<Lock size={18} />} label="设置手势解锁" onClick={() => { setPhase('set'); setFirstPattern(null); setError('') }} last />
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12, lineHeight: 1.6 }}>
        开启后每次打开应用需要绘制手势解锁才能进入
      </div>
    </div>
  )
}

function hashPattern(pattern: number[]): string {
  const str = pattern.join('-')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return 'g_' + Math.abs(hash).toString(36)
}

function PatternGrid({ onComplete }: { onComplete: (pattern: number[]) => void }) {
  const [selected, setSelected] = useState<number[]>([])
  const [drawing, setDrawing] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const gridRef = { current: null as HTMLDivElement | null }
  const SIZE = 240
  const DOT_GAP = SIZE / 3
  const DOT_R = 12

  const dots = Array.from({ length: 9 }, (_, i) => ({
    idx: i,
    cx: (i % 3) * DOT_GAP + DOT_GAP / 2,
    cy: Math.floor(i / 3) * DOT_GAP + DOT_GAP / 2,
  }))

  const getTouch = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return null
    const t = 'touches' in e ? e.touches[0] || e.changedTouches[0] : e
    return { x: t.clientX - rect.left, y: t.clientY - rect.top }
  }

  const hitDot = (x: number, y: number) => {
    for (const d of dots) {
      if (Math.hypot(x - d.cx, y - d.cy) < DOT_R * 1.8) return d.idx
    }
    return -1
  }

  const addDot = (idx: number) => {
    if (idx >= 0 && !selected.includes(idx)) setSelected(prev => [...prev, idx])
  }

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const p = getTouch(e)
    if (!p) return
    const idx = hitDot(p.x, p.y)
    if (idx >= 0) { setSelected([idx]); setDrawing(true); setPos(p) }
  }

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawing) return
    e.preventDefault()
    const p = getTouch(e)
    if (!p) return
    setPos(p)
    addDot(hitDot(p.x, p.y))
  }

  const handleEnd = () => {
    if (!drawing) return
    setDrawing(false)
    setPos(null)
    if (selected.length > 0) {
      onComplete(selected)
      setTimeout(() => setSelected([]), 500)
    }
  }

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 1; i < selected.length; i++) {
    const a = dots[selected[i - 1]], b = dots[selected[i]]
    lines.push({ x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy })
  }
  if (drawing && pos && selected.length > 0) {
    const last = dots[selected[selected.length - 1]]
    lines.push({ x1: last.cx, y1: last.cy, x2: pos.x, y2: pos.y })
  }

  return (
    <div ref={el => { gridRef.current = el }} style={{ width: SIZE, height: SIZE, position: 'relative', touchAction: 'none' }}
      onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
      onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}>
      <svg width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0 }}>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--brand)" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
        ))}
      </svg>
      {dots.map(d => (
        <div key={d.idx} style={{
          position: 'absolute', left: d.cx - DOT_R, top: d.cy - DOT_R,
          width: DOT_R * 2, height: DOT_R * 2, borderRadius: '50%',
          background: selected.includes(d.idx) ? 'var(--brand)' : 'var(--bg-secondary)',
          border: `2.5px solid ${selected.includes(d.idx) ? 'var(--brand)' : 'var(--border-primary)'}`,
          transition: 'all 0.15s', boxShadow: selected.includes(d.idx) ? '0 0 8px rgba(59,130,246,0.4)' : 'none',
        }} />
      ))}
    </div>
  )
}

interface Props {
  tab: 'profile' | 'account' | 'sound' | 'appearance' | 'notification'
  onBack: () => void
  isMobile?: boolean
}

export default function SettingsPanel({ tab, onBack, isMobile }: Props) {
  const { user } = useUserStore()
  const { mode, setMode } = useThemeStore()

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const [soundPrefs, setSoundPrefs] = useState<Record<string, boolean>>(getSoundPrefs)
  const [soundVolume, setSoundVolume] = useState(() => {
    try { return Number(localStorage.getItem('sound_volume') ?? 100) } catch { return 100 }
  })

  const [accountSubView, setAccountSubView] = useState<'main' | 'password' | 'gesture'>('main')

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
    if (!pwForm.current) { setPwMsg('请输入当前密码'); return }
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
      width: '100%', height: '100%', background: 'var(--bg-primary)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
          {tab === 'profile' ? '个人信息' : tab === 'account' ? '账号与安全' : tab === 'sound' ? '声音设置' : tab === 'appearance' ? '外观与语言' : '通知偏好'}
        </span>
        <div onClick={() => onBack()} style={{ cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <X size={16} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
              <Avatar name={user.nickname || user.username} size={56} src={user.avatar || undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.username}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Hash size={11} /> {user.display_id || `#${user.id}`}
                  </div>
                  {user.email && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={11} /> {user.email}
                  </div>}
                  {user.phone && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={11} /> {user.phone}
                  </div>}
                </div>
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

        {tab === 'account' && isMobile && (
          accountSubView === 'main' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, paddingLeft: 4 }}>个人信息</div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden' }}>
                  <SettingRow icon={<Phone size={18} />} label="手机号" value={user.phone ? user.phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : '未绑定'} />
                  <SettingRow icon={<Mail size={18} />} label="邮箱" value={user.email || '未绑定'} last />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, paddingLeft: 4 }}>安全管理</div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden' }}>
                  <SettingRow icon={<Key size={18} />} label="修改密码" onClick={() => setAccountSubView('password')} />
                  {isCapacitor && (
                    <SettingRow icon={<Lock size={18} />} label="手势解锁"
                      value={localStorage.getItem('gesture_lock_hash') ? '已设置' : '未设置'}
                      onClick={() => setAccountSubView('gesture')} />
                  )}
                </div>
              </div>
            </div>
          ) : accountSubView === 'password' ? (
            <div>
              <div onClick={() => setAccountSubView('main')} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
                <ArrowLeft size={16} /> 返回
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 16 }}>修改密码</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input label="当前密码" type="password" placeholder="输入当前密码" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
                <Input label="新密码" type="password" placeholder="至少8位，含字母和数字" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} />
                <Input label="确认新密码" type="password" placeholder="再次输入新密码" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                {pwMsg && <div style={{ fontSize: 12, color: pwMsg === '密码修改成功' ? 'var(--color-success)' : 'var(--color-danger)' }}>{pwMsg}</div>}
                <button onClick={handleChangePw} disabled={pwSaving}
                  style={{ padding: '10px 0', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', opacity: pwSaving ? 0.6 : 1, marginTop: 4 }}>
                  {pwSaving ? '修改中...' : '确认修改'}
                </button>
              </div>
            </div>
          ) : accountSubView === 'gesture' ? (
            <GestureLockSettings onBack={() => setAccountSubView('main')} />
          ) : null
        )}

        {tab === 'account' && !isMobile && (
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
              <div style={{
                flex: 1, padding: '10px 12px', borderRadius: 8,
                border: '2px solid var(--brand)', background: 'var(--bg-selected)',
                fontSize: 12, fontWeight: 600, color: 'var(--brand)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Globe size={14} /> 简体中文
                <Check size={12} style={{ marginLeft: 'auto', color: 'var(--brand)' }} />
              </div>
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
