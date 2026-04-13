import { useState, useEffect, useRef } from 'react'
import { User, Bell, Settings2, Globe, Save, Copy, ArrowLeft, Check, Loader2, Lock, Smartphone, Monitor, Trash2, LogOut, ChevronRight, Mail, Phone, KeyRound, Camera, Volume2, Shield, Eye, Palette, HardDrive, HelpCircle, Info } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import useThemeStore from '../../stores/useThemeStore'
import Avatar from '../ui/Avatar'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import useIsMobile from '../ui/useIsMobile'
import PageHeader from '../ui/PageHeader'
import { APP_VERSION } from '../../utils/capacitor'

type Tab = 'account' | 'preference' | 'notification'
type AccountSub = 'profile' | 'password' | 'devices' | 'phone' | 'email' | 'security' | 'notification' | 'appearance' | 'privacy' | 'storage' | 'feedback' | 'about' | null

const TABS: { key: Tab; label: string; icon: typeof User }[] = [
  { key: 'account', label: '账号与安全', icon: User },
  { key: 'preference', label: '偏好设置', icon: Settings2 },
  { key: 'notification', label: '通知设置', icon: Bell },
]

const roleLabel: Record<string, string> = { admin: '管理员', manager: '经理', member: '成员' }

const NOTIF_GROUPS = [
  {
    key: 'task', label: '需求管理',
    items: [
      { key: 'notif_task_assign', label: '需求分配', desc: '当有人给你分配新需求时通知' },
      { key: 'notif_task_status', label: '需求状态变更', desc: '你参与的需求状态发生变化时通知' },
      { key: 'notif_task_comment', label: '需求评论', desc: '你参与的需求有新评论时通知' },
    ],
  },
  {
    key: 'project', label: '项目管理',
    items: [
      { key: 'notif_project_update', label: '项目更新', desc: '你参与的项目信息更新时通知' },
      { key: 'notif_project_member', label: '成员变动', desc: '你参与的项目有新成员加入或离开' },
      { key: 'notif_milestone', label: '里程碑', desc: '里程碑状态变更或到期提醒' },
    ],
  },
  {
    key: 'client', label: '客户管理',
    items: [
      { key: 'notif_follow_reminder', label: '跟进提醒', desc: '客户跟进到期提醒' },
      { key: 'notif_ticket_reply', label: '工单回复', desc: '你提交的工单有新回复时通知' },
    ],
  },
  {
    key: 'system', label: '系统与安全',
    items: [
      { key: 'notif_system', label: '系统通知', desc: '系统维护、版本更新等通知' },
      { key: 'notif_security', label: '安全提醒', desc: '账号在新设备登录等安全事件' },
    ],
  },
]

const ALL_NOTIF_KEYS = NOTIF_GROUPS.flatMap(g => g.items.map(i => i.key))

const SOUND_ITEMS = [
  { key: 'sound_message', label: '项目消息', desc: '项目频道中的新消息' },
  { key: 'sound_dm', label: '私信', desc: '新的私信消息' },
  { key: 'sound_notification', label: '系统通知', desc: '系统通知提示音' },
  { key: 'sound_task', label: '新需求', desc: '新需求分配提示音' },
]

function getNotifPrefs(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('notif_prefs')
    if (stored) return JSON.parse(stored)
  } catch {}
  const defaults: Record<string, boolean> = {}
  ALL_NOTIF_KEYS.forEach(k => (defaults[k] = true))
  return defaults
}

function getSoundPrefs(): Record<string, boolean> {
  try { const s = localStorage.getItem('sound_prefs'); if (s) return JSON.parse(s) } catch {}
  const d: Record<string, boolean> = {}
  SOUND_ITEMS.forEach(p => (d[p.key] = true))
  return d
}

export default function UserSettings() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, updateProfile, logout } = useUserStore()
  const { mode, setMode } = useThemeStore()

  const initialTab = (searchParams.get('tab') as Tab) || 'account'
  const [tab, setTab] = useState<Tab>(initialTab)
  const accountSub = (searchParams.get('sub') as AccountSub) || null

  // Account editing
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', nickname: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  // Change password
  const [pwForm, setPwForm] = useState({ code: '', newPwd: '', confirmPwd: '' })
  const [pwSending, setPwSending] = useState(false)
  const [pwCooldown, setPwCooldown] = useState(0)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwDevCode, setPwDevCode] = useState('')

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(getNotifPrefs)

  // Sound prefs
  const [soundPrefs, setSoundPrefs] = useState<Record<string, boolean>>(getSoundPrefs)
  const [soundVolume, setSoundVolume] = useState(() => {
    try { return Number(localStorage.getItem('sound_volume') ?? 100) } catch { return 100 }
  })

  // Profile editing (WeChat-style)
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profileEdit, setProfileEdit] = useState<'nickname' | 'gender' | 'position' | 'department' | 'employee_no' | null>(null)
  const [profileFieldValue, setProfileFieldValue] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Session management
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const loadSessions = async () => {
    setSessionsLoading(true)
    const r = await fetchApi('/api/auth/sessions')
    setSessionsLoading(false)
    if (r.success) setSessions(r.data || [])
  }

  useEffect(() => {
    if (tab === 'account') loadSessions()
  }, [tab])

  const startEditing = () => {
    if (user) setForm({ username: user.username || '', nickname: user.nickname || '', email: user.email || '', phone: user.phone || '' })
    setEditing(true)
  }

  const handleSave = async () => {
    const body: any = {}
    if (form.username.trim() && form.username.trim() !== (user?.username || '')) {
      const uname = form.username.trim()
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) { toast('用户名只能包含英文、数字和下划线，3-20位', 'error'); return }
      body.username = uname
    }
    if (form.nickname.trim() && form.nickname.trim() !== (user?.nickname || '')) body.nickname = form.nickname.trim()
    if (form.email.trim() !== (user?.email || '')) body.email = form.email.trim()
    if (form.phone.trim() !== (user?.phone || '')) body.phone = form.phone.trim()
    if (Object.keys(body).length === 0) { toast('没有需要更新的内容', 'error'); return }
    setSaving(true)
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
    setSaving(false)
    if (r.success) { toast('个人信息已更新', 'success'); updateProfile(r.data); setEditing(false) }
    else toast(r.message || '更新失败', 'error')
  }

  const copyText = async (value: string, message: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
      else {
        const t = document.createElement('textarea'); t.value = value; t.style.position = 'fixed'; t.style.opacity = '0'
        document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
      }
      toast(message, 'success')
    } catch { toast('复制失败', 'error') }
  }

  const toggleNotif = (key: string) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(next)
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

  const toggleGroupNotif = (groupKey: string) => {
    const group = NOTIF_GROUPS.find(g => g.key === groupKey)
    if (!group) return
    const allOn = group.items.every(i => notifPrefs[i.key] !== false)
    const next = { ...notifPrefs }
    group.items.forEach(i => { next[i.key] = !allOn })
    setNotifPrefs(next)
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

  const toggleSound = (key: string) => {
    const next = { ...soundPrefs, [key]: !soundPrefs[key] }
    setSoundPrefs(next)
    localStorage.setItem('sound_prefs', JSON.stringify(next))
  }

  const handleVolumeChange = (v: number) => {
    setSoundVolume(v)
    localStorage.setItem('sound_volume', String(v))
  }

  const handleProfileAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast('头像不能超过 2MB', 'error'); return }
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.type)) { toast('只支持 JPG/PNG/GIF/WebP 格式', 'error'); return }
    setAvatarUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/auth/avatar', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const r = await res.json()
      if (r.success) { toast('头像已更新', 'success'); updateProfile(r.data) }
      else toast(r.message || '上传失败', 'error')
    } catch { toast('上传失败', 'error') }
    setAvatarUploading(false)
    if (avatarFileRef.current) avatarFileRef.current.value = ''
  }

  const handleProfileSaveField = async (field: string, val: string, label: string) => {
    if (field === 'nickname' && !val.trim()) { toast('昵称不能为空', 'error'); return }
    setProfileSaving(true)
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ [field]: val.trim() || null }) })
    setProfileSaving(false)
    if (r.success) { updateProfile(r.data); setProfileEdit(null); toast(`${label}已更新`, 'success') }
    else toast(r.message || '修改失败', 'error')
  }

  const handleProfileSaveGender = async (val: number) => {
    setProfileSaving(true)
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ gender: val }) })
    setProfileSaving(false)
    if (r.success) { updateProfile(r.data); setProfileEdit(null); toast('已更新', 'success') }
    else toast(r.message || '修改失败', 'error')
  }

  const sidebarStyle: React.CSSProperties = {
    width: isMobile ? '100%' : 180, flexShrink: 0,
    background: 'var(--bg-primary)', borderRight: isMobile ? 'none' : '1px solid var(--border-primary)',
    borderBottom: isMobile ? '1px solid var(--border-primary)' : 'none',
    padding: isMobile ? '8px 12px' : '20px 0',
    display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 4 : 2,
    overflowX: isMobile ? 'auto' : 'visible',
  }

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '8px 12px' : '10px 20px',
    cursor: 'pointer', border: 'none', background: active ? 'var(--bg-selected)' : 'transparent',
    color: active ? 'var(--brand)' : 'var(--text-secondary)', fontSize: 13, fontWeight: active ? 600 : 500,
    borderRadius: isMobile ? 8 : 0, borderLeft: !isMobile && active ? '3px solid var(--brand)' : !isMobile ? '3px solid transparent' : 'none',
    whiteSpace: 'nowrap', textAlign: 'left' as const, transition: 'all 0.15s',
    width: isMobile ? 'auto' : '100%',
  })

  return (
    <div>
      {!isMobile && (
        <PageHeader
          title="设置"
          actions={
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
              <ArrowLeft size={20} />
            </button>
          }
        />
      )}

      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        background: isMobile ? 'transparent' : 'var(--bg-primary)', borderRadius: isMobile ? 0 : 12,
        border: isMobile ? 'none' : '1px solid var(--border-primary)',
        minHeight: isMobile ? 'auto' : 500, overflow: 'hidden',
      }}>
        {/* 左侧 Tab 导航（仅 PC） */}
        {!isMobile && (
          <div style={sidebarStyle}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={tabBtnStyle(tab === t.key)}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        )}

        {/* 内容区 */}
        <div style={{ flex: 1, padding: isMobile ? 4 : 32, overflowY: 'auto', background: isMobile ? 'transparent' : 'var(--bg-secondary)' }}>

          {/* ===== 账号与安全 ===== */}
          {tab === 'account' && user && (
            <div>
              {/* ── 移动端：子页面模式 ── */}
              {isMobile ? (
                !accountSub ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/my')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>设置</div>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)', padding: '8px 16px 4px' }}>账号</div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                      <SettingsMenuItem icon={User} label="个人资料" desc={user.nickname || user.username} onClick={() => navigate('/user-settings?sub=profile')} />
                      <SettingsMenuItem icon={Shield} label="账号安全" onClick={() => navigate('/user-settings?sub=security')} />
                      <SettingsMenuItem icon={Eye} label="个人信息与权限" onClick={() => navigate('/user-settings?sub=privacy')} last />
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)', padding: '8px 16px 4px' }}>通用</div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                      <SettingsMenuItem icon={Bell} label="通知" onClick={() => navigate('/user-settings?sub=notification')} />
                      <SettingsMenuItem icon={Palette} label="界面与显示" desc={mode === 'dark' ? '深色模式' : mode === 'light' ? '浅色模式' : '跟随系统'} onClick={() => navigate('/user-settings?sub=appearance')} />
                      <SettingsMenuItem icon={HardDrive} label="存储空间" onClick={() => navigate('/user-settings?sub=storage')} last />
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)', padding: '8px 16px 4px' }}>帮助与关于</div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                      <SettingsMenuItem icon={HelpCircle} label="帮助与反馈" onClick={() => navigate('/user-settings?sub=feedback')} />
                      <SettingsMenuItem icon={Info} label="关于 DuiJie" desc={`v${APP_VERSION}`} onClick={() => navigate('/user-settings?sub=about')} last />
                    </div>

                    <div onClick={logout} style={{
                      marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: 16, borderRadius: 16, background: 'var(--bg-primary)', cursor: 'pointer',
                      color: 'var(--color-danger)', fontSize: 15, fontWeight: 500,
                    }}>
                      <LogOut size={16} /> 退出登录
                    </div>
                  </div>
                ) : accountSub === 'profile' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>个人资料</div>
                    </div>

                    <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleProfileAvatarUpload} />

                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
                      <div onClick={() => avatarFileRef.current?.click()} style={{
                        display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
                      }}>
                        <span style={{ fontSize: 15, color: 'var(--text-heading)', flexShrink: 0, width: 72 }}>头像</span>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
                          <div style={{ position: 'relative' }}>
                            <Avatar name={user.nickname || user.username} size={56} src={user.avatar || undefined} />
                            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-primary)' }}>
                              <Camera size={10} color="#fff" />
                            </div>
                            {avatarUploading && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /></div>}
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--text-disabled)' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
                      <ProfileInfoRow label="昵称" value={user.nickname || '未设置'} onClick={() => { setProfileFieldValue(user.nickname || ''); setProfileEdit('nickname') }} />
                      <ProfileInfoRow label="用户名" value={user.username} />
                      <ProfileInfoRow label="性别" value={user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未设置'} onClick={() => setProfileEdit('gender')} last />
                    </div>

                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
                      <ProfileInfoRow label="职位" value={user.position || '未填写'} onClick={() => { setProfileFieldValue(user.position || ''); setProfileEdit('position') }} />
                      <ProfileInfoRow label="部门" value={user.department || '未填写'} onClick={() => { setProfileFieldValue(user.department || ''); setProfileEdit('department') }} />
                      <ProfileInfoRow label="工号" value={user.employee_no || '未填写'} onClick={() => { setProfileFieldValue(user.employee_no || ''); setProfileEdit('employee_no') }} last />
                    </div>

                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
                      <ProfileInfoRow label="手机号" value={user.phone ? user.phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : '未绑定'} onClick={() => navigate('/user-settings?tab=account&sub=phone')} />
                      <ProfileInfoRow label="邮箱" value={user.email || '未绑定'} onClick={() => navigate('/user-settings?tab=account&sub=email')} last />
                    </div>

                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden' }}>
                      <ProfileInfoRow label="个人ID" value={user.display_id || `#${user.id}`} />
                      {user.personal_invite_code && <ProfileInfoRow label="邀请码" value={user.personal_invite_code} onClick={() => copyText(user.personal_invite_code || '', '邀请码已复制')} />}
                      <ProfileInfoRow label="角色" value={roleLabel[user.role] || user.role} />
                      <ProfileInfoRow label="注册时间" value={user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'} last />
                    </div>

                    {profileEdit && profileEdit !== 'gender' && (() => {
                      const fieldMeta: Record<string, { label: string; placeholder: string }> = {
                        nickname: { label: '修改昵称', placeholder: '输入昵称' },
                        position: { label: '修改职位', placeholder: '如：产品经理、前端工程师' },
                        department: { label: '修改部门', placeholder: '如：技术部、产品部' },
                        employee_no: { label: '修改工号', placeholder: '输入工号' },
                      }
                      const meta = fieldMeta[profileEdit]
                      if (!meta) return null
                      return (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                          onClick={() => setProfileEdit(null)}>
                          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, background: 'var(--bg-primary)', borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 20, textAlign: 'center' }}>{meta.label}</div>
                            <Input placeholder={meta.placeholder} value={profileFieldValue} onChange={e => setProfileFieldValue(e.target.value)} />
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                              <button onClick={() => setProfileEdit(null)}
                                style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                                取消
                              </button>
                              <button onClick={() => handleProfileSaveField(profileEdit, profileFieldValue, meta.label.replace('修改', ''))} disabled={profileSaving}
                                style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer', opacity: profileSaving ? 0.6 : 1 }}>
                                {profileSaving ? '保存中...' : '保存'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {profileEdit === 'gender' && (
                      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end' }}
                        onClick={() => setProfileEdit(null)}>
                        <div onClick={e => e.stopPropagation()} style={{
                          width: '100%', background: 'var(--bg-primary)', borderRadius: '16px 16px 0 0',
                          padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                        }}>
                          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)', textAlign: 'center', marginBottom: 16 }}>选择性别</div>
                          {[{ val: 1, label: '男' }, { val: 2, label: '女' }].map((opt, i) => (
                            <div key={opt.val} onClick={() => handleProfileSaveGender(opt.val)} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '15px 16px', cursor: 'pointer',
                              borderBottom: i === 0 ? '1px solid var(--border-secondary)' : 'none',
                            }}>
                              <span style={{ fontSize: 16, color: 'var(--text-heading)' }}>{opt.label}</span>
                              {user.gender === opt.val && <Check size={18} style={{ color: 'var(--brand)' }} />}
                            </div>
                          ))}
                          <button onClick={() => setProfileEdit(null)} style={{
                            width: '100%', marginTop: 12, padding: '13px 0', borderRadius: 12,
                            border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                            fontSize: 16, fontWeight: 500, cursor: 'pointer',
                          }}>取消</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : accountSub === 'password' ? (
                  <MobileSubPage title="密码设置" onBack={() => navigate('/user-settings?sub=security')}>
                    {(user.phone || user.email) ? (() => {
                      const usePhone = !!user.phone
                      const verifyTarget = usePhone ? user.phone : user.email!
                      const verifyType = usePhone ? 'phone' : 'email'
                      return (
                        <ChangePasswordBlock
                          phone={usePhone ? user.phone : undefined}
                          email={!usePhone ? user.email : undefined}
                          form={pwForm} setForm={setPwForm}
                          sending={pwSending} cooldown={pwCooldown} saving={pwSaving} devCode={pwDevCode}
                          onSendCode={async () => {
                            setPwSending(true)
                            const r = await fetchApi('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ type: verifyType, target: verifyTarget }) })
                            setPwSending(false)
                            if (r.success) {
                              toast('验证码已发送', 'success')
                              if (r._dev_code) setPwDevCode(r._dev_code)
                              setPwCooldown(60)
                              const t = setInterval(() => setPwCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
                            } else toast(r.message || '发送失败', 'error')
                          }}
                          onSubmit={async () => {
                            if (!pwForm.code) { toast('请输入验证码', 'error'); return }
                            if (pwForm.newPwd.length < 8) { toast('密码至少8位', 'error'); return }
                            if (!/[a-zA-Z]/.test(pwForm.newPwd) || !/[0-9]/.test(pwForm.newPwd)) { toast('密码必须包含字母和数字', 'error'); return }
                            if (pwForm.newPwd !== pwForm.confirmPwd) { toast('两次密码不一致', 'error'); return }
                            setPwSaving(true)
                            const r = await fetchApi('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({ code: pwForm.code, new_password: pwForm.newPwd }) })
                            setPwSaving(false)
                            if (r.success) { toast('密码修改成功', 'success'); setPwForm({ code: '', newPwd: '', confirmPwd: '' }); setPwDevCode('') }
                            else toast(r.message || '修改失败', 'error')
                          }}
                        />
                      )
                    })() : (
                      <div style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: 16, textAlign: 'center' }}>
                        <Mail size={18} style={{ marginBottom: 8 }} /><br />请先绑定手机号或邮箱后才能修改密码
                      </div>
                    )}
                  </MobileSubPage>
                ) : accountSub === 'devices' ? (
                  <MobileSubPage title="登录设备管理" onBack={() => navigate('/user-settings?sub=security')}>
                    {sessionsLoading ? (
                      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: 24, textAlign: 'center' }}>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', verticalAlign: -3 }} /> 加载中...
                      </div>
                    ) : sessions.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: 24, textAlign: 'center' }}>暂无活跃会话</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {sessions.map((s: any, idx: number) => (
                          <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                            borderBottom: idx < sessions.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                          }}>
                            <Monitor size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{s.device_name} · {s.browser}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>IP: {s.ip_address} · {new Date(s.created_at).toLocaleString('zh-CN')}</div>
                            </div>
                            <button onClick={async () => {
                              setRevokingId(s.id)
                              const r = await fetchApi(`/api/auth/sessions/${s.id}`, { method: 'DELETE' })
                              setRevokingId(null)
                              if (r.success) { toast('设备已注销', 'success'); setSessions(prev => prev.filter(x => x.id !== s.id)) }
                              else toast(r.message || '操作失败', 'error')
                            }} disabled={revokingId === s.id} style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
                              border: '1px solid var(--border-primary)', background: 'transparent',
                              color: '#ef4444', fontSize: 13, cursor: 'pointer', flexShrink: 0,
                            }}>
                              {revokingId === s.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />} 注销
                            </button>
                          </div>
                        ))}
                        {sessions.length > 1 && (
                          <div style={{ padding: '12px 16px' }}>
                            <button onClick={async () => {
                              setRevokingAll(true)
                              const r = await fetchApi('/api/auth/sessions/all', { method: 'DELETE' })
                              setRevokingAll(false)
                              if (r.success) { toast(r.message || '已注销所有其他设备', 'success'); loadSessions() }
                              else toast(r.message || '操作失败', 'error')
                            }} disabled={revokingAll} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              width: '100%', padding: '10px 0', borderRadius: 10,
                              border: '1px solid #ef4444', background: 'transparent',
                              color: '#ef4444', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                            }}>
                              {revokingAll ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={14} />} 注销所有其他设备
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </MobileSubPage>
                ) : accountSub === 'phone' ? (
                  <MobileSubPage title="绑定手机号" onBack={() => navigate('/user-settings?sub=security')}>
                    <BindContactBlock type="phone" currentValue={user.phone || ''} userId={user.id}
                      onUpdated={(val) => { updateProfile({ phone: val }); toast('手机号已更新', 'success') }} />
                  </MobileSubPage>
                ) : accountSub === 'email' ? (
                  <MobileSubPage title="绑定邮箱" onBack={() => navigate('/user-settings?sub=security')}>
                    <BindContactBlock type="email" currentValue={user.email || ''} userId={user.id}
                      onUpdated={(val) => { updateProfile({ email: val }); toast('邮箱已更新', 'success') }} />
                  </MobileSubPage>
                ) : accountSub === 'security' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>账号安全</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                      {([
                        { key: 'password' as const, icon: KeyRound, label: '密码设置', desc: '修改登录密码' },
                        { key: 'devices' as const, icon: Monitor, label: '登录设备管理', desc: `${sessions.length} 个活跃设备` },
                        { key: 'phone' as const, icon: Phone, label: '绑定手机号', desc: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定' },
                        { key: 'email' as const, icon: Mail, label: '绑定邮箱', desc: user.email || '未绑定' },
                      ]).map((item, i, arr) => (
                        <div key={item.key} onClick={() => navigate(`/user-settings?sub=${item.key}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer',
                            borderBottom: i < arr.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                          }}>
                          <item.icon size={20} style={{ color: 'var(--brand)', flexShrink: 0, opacity: 0.8 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                    {user.personal_invite_code && (
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginBottom: 10 }}>我的专属邀请码</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--bg-selected)', borderRadius: 10, border: '1px solid var(--border-secondary)' }}>
                          <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: 'var(--brand)', flex: 1 }}>{user.personal_invite_code}</code>
                          <button onClick={() => copyText(user.personal_invite_code || '', '邀请码已复制')}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                            <Copy size={14} /> 复制
                          </button>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>分享邀请码，对方注册后将自动成为你的客户</div>
                      </div>
                    )}
                  </div>
                ) : accountSub === 'notification' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>通知设置</div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', padding: '0 4px' }}>按模块管理你希望接收的通知类型</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {NOTIF_GROUPS.map(group => {
                        const allOn = group.items.every(i => notifPrefs[i.key] !== false)
                        const someOn = group.items.some(i => notifPrefs[i.key] !== false)
                        return (
                          <div key={group.key} style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--bg-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: allOn ? 'var(--brand)' : someOn ? '#f59e0b' : 'var(--border-primary)' }} />
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', flex: 1 }}>{group.label}</span>
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 8 }}>{group.items.filter(i => notifPrefs[i.key] !== false).length}/{group.items.length}</span>
                              <ToggleSwitch on={allOn} onToggle={() => toggleGroupNotif(group.key)} />
                            </div>
                            {group.items.map((item, idx) => (
                              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: idx < group.items.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{item.label}</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
                                </div>
                                <ToggleSwitch on={notifPrefs[item.key] !== false} onToggle={() => toggleNotif(item.key)} />
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : accountSub === 'appearance' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>界面与显示</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>外观主题</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {([
                          { value: 'light' as const, label: '浅色', emoji: '☀️' },
                          { value: 'dark' as const, label: '深色', emoji: '🌙' },
                          { value: 'system' as const, label: '跟随系统', emoji: '💻' },
                        ]).map(opt => (
                          <div key={opt.value} onClick={() => setMode(opt.value)} style={{
                            flex: 1, padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
                            border: mode === opt.value ? '2px solid var(--brand)' : '2px solid var(--border-primary)',
                            background: mode === opt.value ? 'var(--bg-selected)' : 'var(--bg-secondary)',
                            textAlign: 'center',
                          }}>
                            <div style={{ fontSize: 24 }}>{opt.emoji}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: mode === opt.value ? 'var(--brand)' : 'var(--text-heading)', marginTop: 4 }}>{opt.label}</div>
                            {mode === opt.value && <Check size={14} style={{ color: 'var(--brand)', marginTop: 2 }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>声音提示</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Volume2 size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                        <input type="range" min={0} max={100} value={soundVolume} onChange={e => handleVolumeChange(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--brand)' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>{soundVolume}%</span>
                      </div>
                      {SOUND_ITEMS.map((item, idx) => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: idx < SOUND_ITEMS.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
                          </div>
                          <ToggleSwitch on={soundPrefs[item.key] !== false} onToggle={() => toggleSound(item.key)} />
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>语言与时区</div>
                      <div style={{ padding: '12px 14px', borderRadius: 12, border: '2px solid var(--brand)', background: 'var(--bg-selected)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Globe size={18} style={{ color: 'var(--brand)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>简体中文</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Chinese Simplified</div>
                        </div>
                        <Check size={14} style={{ color: 'var(--brand)' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>时区</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>影响日期时间的显示</div>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>UTC+8</span>
                      </div>
                    </div>
                  </div>
                ) : accountSub === 'privacy' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>个人信息与权限</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden' }}>
                      {[
                        { label: '显示在线状态', desc: '让团队成员看到你的在线状态' },
                        { label: '允许通过手机号查找', desc: '其他用户可通过手机号搜索到你' },
                        { label: '允许通过邮箱查找', desc: '其他用户可通过邮箱搜索到你' },
                      ].map((item, idx, arr) => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '15px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-heading)' }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
                          </div>
                          <ToggleSwitch on={true} onToggle={() => toast('功能开发中', 'info')} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : accountSub === 'storage' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>存储空间</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-heading)' }}>缓存数据</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>包括页面缓存和临时文件</div>
                        </div>
                      </div>
                      <button onClick={() => {
                        if ('caches' in window) caches.keys().then(names => names.forEach(name => caches.delete(name)))
                        localStorage.removeItem('notif_prefs')
                        localStorage.removeItem('sound_prefs')
                        localStorage.removeItem('sound_volume')
                        toast('缓存已清理', 'success')
                      }} style={{
                        width: '100%', padding: '12px 0', borderRadius: 12, border: '1px solid var(--border-primary)',
                        background: 'transparent', color: 'var(--color-danger)', fontSize: 15, fontWeight: 500, cursor: 'pointer',
                      }}>
                        清除全部缓存
                      </button>
                    </div>
                  </div>
                ) : accountSub === 'feedback' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>帮助与反馈</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-heading)' }}>常见问题</div>
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.6 }}>如遇到问题，请先检查网络连接。如果问题持续存在，请联系管理员。</div>
                      </div>
                      <div style={{ padding: '15px 16px' }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-heading)' }}>联系我们</div>
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.6 }}>如有建议或反馈，请联系系统管理员。</div>
                      </div>
                    </div>
                  </div>
                ) : accountSub === 'about' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
                      <button onClick={() => navigate('/user-settings')} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>关于 DuiJie</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand)', marginBottom: 8 }}>DuiJie</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>企业级项目管理与客户协作平台</div>
                      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>版本 {APP_VERSION}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>© 2024-{new Date().getFullYear()} DuiJie</div>
                    </div>
                  </div>
                ) : null
              ) : (
                /* ── PC端：保持原有布局 ── */
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 20px' }}>我的账号</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 24 }}>
                    <Avatar name={user.nickname || user.username} size={64} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)' }}>{user.nickname || user.username}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>@{user.username}</div>
                      <div style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-selected)', color: 'var(--brand)', fontWeight: 500, marginTop: 4 }}>
                        {roleLabel[user.role] || user.role}
                      </div>
                    </div>
                    {!editing && <Button variant="secondary" onClick={startEditing} style={{ flexShrink: 0 }}>编辑资料</Button>}
                  </div>

                  {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <SectionTitle>基本信息</SectionTitle>
                      <Input label="用户名" placeholder="英文、数字和下划线，3-20位" value={form.username} onChange={e => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} />
                      <Input label="昵称" placeholder="输入昵称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
                      <Input label="邮箱" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                      <Input label="手机号" placeholder="输入手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <Button variant="secondary" onClick={() => setEditing(false)}>取消</Button>
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                          {saving ? ' 保存中...' : ' 保存修改'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <SectionTitle>基本信息</SectionTitle>
                      <InfoGrid items={[
                        { label: '昵称', value: user.nickname || '-' },
                        { label: '邮箱', value: user.email || '-' },
                        { label: '手机号', value: user.phone || '-' },
                        { label: '性别', value: user.gender === 1 ? '男' : user.gender === 2 ? '女' : '-' },
                      ]} />

                      <SectionTitle>账号信息</SectionTitle>
                      <InfoGrid items={[
                        { label: '用户名', value: user.username },
                        { label: '角色', value: roleLabel[user.role] || user.role },
                        { label: '注册时间', value: user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-' },
                        { label: '用户ID', value: user.display_id || `#${user.id}` },
                      ]} />

                      <SectionTitle style={{ marginTop: 8 }}>修改密码</SectionTitle>
                      {(user.phone || user.email) ? (() => {
                        const usePhone = !!user.phone
                        const verifyTarget = usePhone ? user.phone : user.email!
                        const verifyType = usePhone ? 'phone' : 'email'
                        return (
                          <ChangePasswordBlock
                            phone={usePhone ? user.phone : undefined}
                            email={!usePhone ? user.email : undefined}
                            form={pwForm} setForm={setPwForm}
                            sending={pwSending} cooldown={pwCooldown} saving={pwSaving} devCode={pwDevCode}
                            onSendCode={async () => {
                              setPwSending(true)
                              const r = await fetchApi('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ type: verifyType, target: verifyTarget }) })
                              setPwSending(false)
                              if (r.success) {
                                toast('验证码已发送', 'success')
                                if (r._dev_code) setPwDevCode(r._dev_code)
                                setPwCooldown(60)
                                const t = setInterval(() => setPwCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
                              } else toast(r.message || '发送失败', 'error')
                            }}
                            onSubmit={async () => {
                              if (!pwForm.code) { toast('请输入验证码', 'error'); return }
                              if (pwForm.newPwd.length < 8) { toast('密码至少8位', 'error'); return }
                              if (!/[a-zA-Z]/.test(pwForm.newPwd) || !/[0-9]/.test(pwForm.newPwd)) { toast('密码必须包含字母和数字', 'error'); return }
                              if (pwForm.newPwd !== pwForm.confirmPwd) { toast('两次密码不一致', 'error'); return }
                              setPwSaving(true)
                              const r = await fetchApi('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({ code: pwForm.code, new_password: pwForm.newPwd }) })
                              setPwSaving(false)
                              if (r.success) { toast('密码修改成功', 'success'); setPwForm({ code: '', newPwd: '', confirmPwd: '' }); setPwDevCode('') }
                              else toast(r.message || '修改失败', 'error')
                            }}
                          />
                        )
                      })() : (
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 0' }}>
                          <Mail size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                          请先绑定手机号或邮箱，才能修改密码
                        </div>
                      )}

                      {user.personal_invite_code && (
                        <>
                          <SectionTitle>我的专属邀请码</SectionTitle>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--bg-selected)', borderRadius: 10, border: '1px solid var(--border-secondary)' }}>
                            <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: 'var(--brand)', flex: 1 }}>{user.personal_invite_code}</code>
                            <button onClick={() => copyText(user.personal_invite_code || '', '邀请码已复制')}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--brand)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                              <Copy size={14} /> 复制
                            </button>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: -12 }}>分享此邀请码给新用户，对方注册后将自动成为你的客户</div>
                        </>
                      )}

                      <SectionTitle style={{ marginTop: 8 }}>登录设备管理</SectionTitle>
                      {sessionsLoading ? (
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: 12, textAlign: 'center' }}>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', verticalAlign: -3 }} /> 加载中...
                        </div>
                      ) : sessions.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: 12 }}>暂无活跃会话</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {sessions.map((s: any, idx: number) => (
                            <div key={s.id} style={{
                              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                              borderBottom: idx < sessions.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                            }}>
                              <Monitor size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{s.device_name} · {s.browser}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>IP: {s.ip_address} · 登录于 {new Date(s.created_at).toLocaleString('zh-CN')}</div>
                              </div>
                              <button onClick={async () => {
                                setRevokingId(s.id)
                                const r = await fetchApi(`/api/auth/sessions/${s.id}`, { method: 'DELETE' })
                                setRevokingId(null)
                                if (r.success) { toast('设备已注销', 'success'); setSessions(prev => prev.filter(x => x.id !== s.id)) }
                                else toast(r.message || '操作失败', 'error')
                              }} disabled={revokingId === s.id} style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                                border: '1px solid var(--border-primary)', background: 'transparent',
                                color: '#ef4444', fontSize: 12, cursor: 'pointer', flexShrink: 0,
                              }}>
                                {revokingId === s.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />} 注销
                              </button>
                            </div>
                          ))}
                          {sessions.length > 1 && (
                            <div style={{ marginTop: 8 }}>
                              <button onClick={async () => {
                                setRevokingAll(true)
                                const r = await fetchApi('/api/auth/sessions/all', { method: 'DELETE' })
                                setRevokingAll(false)
                                if (r.success) { toast(r.message || '已注销所有其他设备', 'success'); loadSessions() }
                                else toast(r.message || '操作失败', 'error')
                              }} disabled={revokingAll} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                                border: '1px solid #ef4444', background: 'transparent',
                                color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                              }}>
                                {revokingAll ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={14} />} 注销所有其他设备
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== 偏好设置（仅PC） ===== */}
          {!isMobile && tab === 'preference' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 20px' }}>偏好设置</h2>

              <SectionTitle>外观主题</SectionTitle>
              <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                {([
                  { value: 'light' as const, label: '浅色', emoji: '☀️' },
                  { value: 'dark' as const, label: '深色', emoji: '🌙' },
                  { value: 'system' as const, label: '跟随系统', emoji: '💻' },
                ]).map(opt => (
                  <div key={opt.value} onClick={() => setMode(opt.value)}
                    style={{
                      flex: '1 1 100px', padding: '16px 12px', borderRadius: 10, cursor: 'pointer',
                      border: mode === opt.value ? '2px solid var(--brand)' : '2px solid var(--border-primary)',
                      background: mode === opt.value ? 'var(--bg-selected)' : 'var(--bg-secondary)',
                      textAlign: 'center', transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: 24 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: mode === opt.value ? 'var(--brand)' : 'var(--text-heading)', marginTop: 6 }}>{opt.label}</div>
                    {mode === opt.value && <Check size={14} style={{ color: 'var(--brand)', marginTop: 4 }} />}
                  </div>
                ))}
              </div>

              <SectionTitle>声音提示</SectionTitle>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '0 4px' }}>
                  <Volume2 size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  <input type="range" min={0} max={100} value={soundVolume}
                    onChange={e => handleVolumeChange(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--brand)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>{soundVolume}%</span>
                </div>
                {SOUND_ITEMS.map((item, idx) => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                    borderBottom: idx < SOUND_ITEMS.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch on={soundPrefs[item.key] !== false} onToggle={() => toggleSound(item.key)} />
                  </div>
                ))}
              </div>

              <SectionTitle>语言与时区</SectionTitle>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{
                  flex: '1 1 140px', padding: '14px 16px', borderRadius: 10,
                  border: '2px solid var(--brand)', background: 'var(--bg-selected)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Globe size={18} style={{ color: 'var(--brand)' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>简体中文</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Chinese Simplified</div>
                  </div>
                  <Check size={14} style={{ color: 'var(--brand)', marginLeft: 'auto' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>时区</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>影响日期时间的显示</div>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Asia/Shanghai (UTC+8)</span>
              </div>
            </div>
          )}

          {/* ===== 通知设置（仅PC） ===== */}
          {!isMobile && tab === 'notification' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 4px' }}>通知设置</h2>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 24px' }}>按模块管理你希望接收的通知类型</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {NOTIF_GROUPS.map(group => {
                  const allOn = group.items.every(i => notifPrefs[i.key] !== false)
                  const someOn = group.items.some(i => notifPrefs[i.key] !== false)
                  return (
                    <div key={group.key} style={{ borderRadius: 12, border: '1px solid var(--border-secondary)', overflow: 'hidden' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-secondary)',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: allOn ? 'var(--brand)' : someOn ? '#f59e0b' : 'var(--border-primary)' }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', flex: 1 }}>{group.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 8 }}>{group.items.filter(i => notifPrefs[i.key] !== false).length}/{group.items.length}</span>
                        <ToggleSwitch on={allOn} onToggle={() => toggleGroupNotif(group.key)} />
                      </div>
                      <div style={{ background: 'var(--bg-primary)' }}>
                        {group.items.map((item, idx) => (
                          <div key={item.key} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderBottom: idx < group.items.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{item.label}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
                            </div>
                            <ToggleSwitch on={notifPrefs[item.key] !== false} onToggle={() => toggleNotif(item.key)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>{/* end content area */}
      </div>
    </div>
  )
}

/* ── 小组件 ─────────────────────────────────────── */

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border-secondary)', ...style }}>
      {children}
    </div>
  )
}

function InfoGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 13, marginBottom: 4 }}>
      {items.map(i => (
        <div key={i.label}>
          <span style={{ color: 'var(--text-tertiary)' }}>{i.label}</span>
          <div style={{ color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{i.value}</div>
        </div>
      ))}
    </div>
  )
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
      background: on ? 'var(--brand)' : 'var(--border-primary)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 9, background: '#fff',
        position: 'absolute', top: 3,
        left: on ? 21 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

function SettingsMenuItem({ icon: Icon, label, desc, onClick, last }: {
  icon: React.ComponentType<any>; label: string; desc?: string; onClick?: () => void; last?: boolean
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: last ? 'none' : '1px solid var(--border-secondary)',
    }}>
      <Icon size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)' }}>{label}</span>
      {desc && <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{desc}</span>}
      {onClick && <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
    </div>
  )
}

function ProfileInfoRow({ label, value, onClick, last }: { label: string; value?: string; onClick?: () => void; last?: boolean }) {
  const dimmed = value === '未设置' || value === '未绑定' || value === '未填写'
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', padding: '16px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: last ? 'none' : '1px solid var(--border-secondary)',
    }}>
      <span style={{ fontSize: 15, color: 'var(--text-heading)', flexShrink: 0, width: 72 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 15, color: dimmed ? 'var(--text-disabled)' : 'var(--text-tertiary)' }}>{value}</span>
      </div>
      {onClick && <ChevronRight size={16} style={{ color: 'var(--text-disabled)', flexShrink: 0, marginLeft: 4 }} />}
    </div>
  )
}

function MobileSubPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', marginBottom: 8 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</div>
      </div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 16 }}>{children}</div>
    </div>
  )
}

function BindContactBlock({ type, currentValue, userId, onUpdated }: {
  type: 'phone' | 'email'; currentValue: string; userId: number
  onUpdated: (value: string) => void
}) {
  const [value, setValue] = useState(currentValue)
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [saving, setSaving] = useState(false)
  const [devCode, setDevCode] = useState('')
  const isPhone = type === 'phone'
  const label = isPhone ? '手机号' : '邮箱'
  const placeholder = isPhone ? '请输入手机号' : '请输入邮箱地址'
  const icon = isPhone ? <Phone size={18} style={{ color: 'var(--brand)' }} /> : <Mail size={18} style={{ color: 'var(--brand)' }} />

  const validateValue = () => {
    const trimmed = value.trim()
    if (!trimmed) { toast(`请输入${label}`, 'error'); return '' }
    if (isPhone && !/^1\d{10}$/.test(trimmed)) { toast('请输入正确的手机号', 'error'); return '' }
    if (!isPhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { toast('请输入正确的邮箱地址', 'error'); return '' }
    return trimmed
  }

  const handleSendCode = async () => {
    const trimmed = validateValue()
    if (!trimmed) return
    setSending(true)
    const r = await fetchApi('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ type, target: trimmed }) })
    setSending(false)
    if (r.success) {
      toast('验证码已发送', 'success')
      if (r._dev_code) setDevCode(r._dev_code)
      setCooldown(60)
      const t = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
    } else toast(r.message || '发送失败', 'error')
  }

  const handleSave = async () => {
    const trimmed = validateValue()
    if (!trimmed) return
    if (!code) { toast('请输入验证码', 'error'); return }
    if (trimmed === currentValue) { toast('没有变化', 'error'); return }
    setSaving(true)
    const body: any = { code }
    body[type] = trimmed
    const r = await fetchApi('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
    setSaving(false)
    if (r.success) { toast(`${label}${currentValue ? '修改' : '绑定'}成功`, 'success'); onUpdated(trimmed) }
    else toast(r.message || '更新失败', 'error')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'var(--bg-selected)', borderRadius: 12 }}>
        {icon}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>当前{label}</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: currentValue ? 'var(--text-heading)' : 'var(--text-tertiary)', marginTop: 2 }}>
            {currentValue || '未绑定'}
          </div>
        </div>
      </div>
      <Input label={`${currentValue ? '新' : ''}${label}`} placeholder={placeholder} value={value}
        onChange={e => setValue(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input label="验证码" placeholder="输入6位验证码" value={code} onChange={e => setCode(e.target.value)} />
        </div>
        <button onClick={handleSendCode} disabled={sending || cooldown > 0}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)',
            background: cooldown > 0 ? 'var(--bg-tertiary)' : 'var(--brand)',
            color: cooldown > 0 ? 'var(--text-tertiary)' : '#fff',
            fontSize: 13, fontWeight: 500, cursor: cooldown > 0 ? 'default' : 'pointer',
            whiteSpace: 'nowrap', height: 38, flexShrink: 0,
          }}>
          {sending ? '发送中...' : cooldown > 0 ? `${cooldown}s` : '发送验证码'}
        </button>
      </div>
      {devCode && (
        <div style={{ fontSize: 11, color: 'var(--color-warning)', background: 'var(--bg-selected)', padding: '4px 8px', borderRadius: 6 }}>
          开发环境验证码: <strong>{devCode}</strong>
        </div>
      )}
      <button onClick={handleSave} disabled={saving || !code} style={{
        padding: '12px 0', borderRadius: 10, border: 'none',
        background: (!code) ? 'var(--bg-tertiary)' : 'var(--brand)',
        color: (!code) ? 'var(--text-tertiary)' : '#fff',
        fontSize: 15, fontWeight: 600, cursor: (!code) ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
        {saving ? '保存中...' : `${currentValue ? '修改' : '绑定'}${label}`}
      </button>
    </div>
  )
}

function ChangePasswordBlock({ phone, email, form, setForm, sending, cooldown, saving, devCode, onSendCode, onSubmit }: {
  phone?: string
  email?: string
  form: { code: string; newPwd: string; confirmPwd: string }
  setForm: (f: { code: string; newPwd: string; confirmPwd: string }) => void
  sending: boolean
  cooldown: number
  saving: boolean
  devCode: string
  onSendCode: () => void
  onSubmit: () => void
}) {
  const usePhone = !!phone
  const target = usePhone ? phone : email || ''
  const masked = usePhone
    ? target.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    : target.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c)
  const Icon = usePhone ? Smartphone : Mail
  const label = usePhone ? '手机号' : '邮箱'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
        验证{label} <strong style={{ color: 'var(--text-heading)' }}>{masked}</strong> 后修改密码
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input label="验证码" placeholder="输入6位验证码" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
        </div>
        <button
          onClick={onSendCode}
          disabled={sending || cooldown > 0}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)',
            background: cooldown > 0 ? 'var(--bg-tertiary)' : 'var(--brand)',
            color: cooldown > 0 ? 'var(--text-tertiary)' : '#fff',
            fontSize: 13, fontWeight: 500, cursor: cooldown > 0 ? 'default' : 'pointer',
            whiteSpace: 'nowrap', height: 38, flexShrink: 0,
          }}
        >
          {sending ? '发送中...' : cooldown > 0 ? `${cooldown}s` : '发送验证码'}
        </button>
      </div>
      {devCode && (
        <div style={{ fontSize: 11, color: 'var(--color-warning)', background: 'var(--bg-selected)', padding: '4px 8px', borderRadius: 6 }}>
          开发环境验证码: <strong>{devCode}</strong>
        </div>
      )}

      <Input label="新密码" type="password" placeholder="至少8位，包含字母和数字" value={form.newPwd} onChange={e => setForm({ ...form, newPwd: e.target.value })} />
      {form.newPwd && (
        <Input label="确认新密码" type="password" placeholder="再次输入新密码" value={form.confirmPwd} onChange={e => setForm({ ...form, confirmPwd: e.target.value })} />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          onClick={onSubmit}
          disabled={saving || !form.code || !form.newPwd}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: (!form.code || !form.newPwd) ? 'var(--bg-tertiary)' : 'var(--brand)',
            color: (!form.code || !form.newPwd) ? 'var(--text-tertiary)' : '#fff',
            fontSize: 13, fontWeight: 600, cursor: (!form.code || !form.newPwd) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Lock size={14} />
          {saving ? '修改中...' : '确认修改密码'}
        </button>
      </div>
    </div>
  )
}
