import { useState, useEffect } from 'react'
import { User, Bell, Palette, Globe, Save, Copy, ArrowLeft, Check, Loader2, Lock, Smartphone, Monitor, Trash2, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import useThemeStore from '../../stores/useThemeStore'
import useI18nStore, { Locale } from '../../stores/useI18nStore'
import Avatar from '../ui/Avatar'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import useIsMobile from '../ui/useIsMobile'
import PageHeader from '../ui/PageHeader'

type Tab = 'account' | 'appearance' | 'notification'

const TABS: { key: Tab; label: string; icon: typeof User }[] = [
  { key: 'account', label: '账号与安全', icon: User },
  { key: 'appearance', label: '外观与语言', icon: Palette },
  { key: 'notification', label: '通知偏好', icon: Bell },
]

const roleLabel: Record<string, string> = { admin: '管理员', manager: '经理', member: '成员' }

/* 通知开关项（localStorage 存储） */
const NOTIF_PREFS = [
  { key: 'notif_task_assign', label: '任务分配', desc: '当有人给你分配新任务时通知' },
  { key: 'notif_task_status', label: '任务状态变更', desc: '你参与的任务状态发生变化时通知' },
  { key: 'notif_task_comment', label: '任务评论', desc: '你参与的任务有新评论时通知' },
  { key: 'notif_project_update', label: '项目更新', desc: '你参与的项目信息更新时通知' },
  { key: 'notif_follow_reminder', label: '跟进提醒', desc: '客户跟进到期提醒' },
  { key: 'notif_ticket_reply', label: '工单回复', desc: '你提交的工单有新回复时通知' },
  { key: 'notif_system', label: '系统通知', desc: '系统维护、版本更新等通知' },
]

function getNotifPrefs(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('notif_prefs')
    if (stored) return JSON.parse(stored)
  } catch {}
  const defaults: Record<string, boolean> = {}
  NOTIF_PREFS.forEach(p => (defaults[p.key] = true))
  return defaults
}

export default function UserSettings() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { user, updateProfile } = useUserStore()
  const { mode, setMode } = useThemeStore()
  const { locale, setLocale } = useI18nStore()
  const [tab, setTab] = useState<Tab>('account')

  // Account editing
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  // Change password
  const [pwForm, setPwForm] = useState({ code: '', newPwd: '', confirmPwd: '' })
  const [pwSending, setPwSending] = useState(false)
  const [pwCooldown, setPwCooldown] = useState(0)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwDevCode, setPwDevCode] = useState('')

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(getNotifPrefs)

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
    if (user) setForm({ nickname: user.nickname || '', email: user.email || '', phone: user.phone || '' })
    setEditing(true)
  }

  const handleSave = async () => {
    const body: any = {}
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
      <PageHeader
        title="设置"
        actions={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
        }
      />

      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        background: 'var(--bg-primary)', borderRadius: 12,
        border: '1px solid var(--border-primary)',
        minHeight: isMobile ? 'auto' : 500, overflow: 'hidden',
      }}>
        {/* 左侧 Tab 导航 */}
        <div style={sidebarStyle}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabBtnStyle(tab === t.key)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* 右侧内容区 */}
        <div style={{ flex: 1, padding: isMobile ? 16 : 32, overflowY: 'auto', background: 'var(--bg-secondary)' }}>

          {/* ===== 账号与安全 ===== */}
          {tab === 'account' && user && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 20px' }}>我的账号</h2>

              {/* 头像区 */}
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

              {/* 编辑表单 */}
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <SectionTitle>基本信息</SectionTitle>
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
                  {/* 基本信息展示 */}
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

                  {/* 修改密码 */}
                  <SectionTitle style={{ marginTop: 8 }}>修改密码</SectionTitle>
                  {user.phone ? (
                    <ChangePasswordBlock
                      phone={user.phone}
                      form={pwForm}
                      setForm={setPwForm}
                      sending={pwSending}
                      cooldown={pwCooldown}
                      saving={pwSaving}
                      devCode={pwDevCode}
                      onSendCode={async () => {
                        setPwSending(true)
                        const r = await fetchApi('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ type: 'phone', target: user.phone }) })
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
                        if (r.success) {
                          toast('密码修改成功', 'success')
                          setPwForm({ code: '', newPwd: '', confirmPwd: '' })
                          setPwDevCode('')
                        } else toast(r.message || '修改失败', 'error')
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 0' }}>
                      <Smartphone size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                      请先在上方编辑资料中绑定手机号，才能修改密码
                    </div>
                  )}

                  {/* 邀请码 */}
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

                  {/* 登录设备管理 */}
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
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>
                              {s.device_name} · {s.browser}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                              IP: {s.ip_address} · 登录于 {new Date(s.created_at).toLocaleString('zh-CN')}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              setRevokingId(s.id)
                              const r = await fetchApi(`/api/auth/sessions/${s.id}`, { method: 'DELETE' })
                              setRevokingId(null)
                              if (r.success) {
                                toast('设备已注销', 'success')
                                setSessions(prev => prev.filter(x => x.id !== s.id))
                              } else toast(r.message || '操作失败', 'error')
                            }}
                            disabled={revokingId === s.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                              border: '1px solid var(--border-primary)', background: 'transparent',
                              color: '#ef4444', fontSize: 12, cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            {revokingId === s.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                            注销
                          </button>
                        </div>
                      ))}
                      {sessions.length > 1 && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            onClick={async () => {
                              setRevokingAll(true)
                              const r = await fetchApi('/api/auth/sessions/all', { method: 'DELETE' })
                              setRevokingAll(false)
                              if (r.success) {
                                toast(r.message || '已注销所有其他设备', 'success')
                                loadSessions()
                              } else toast(r.message || '操作失败', 'error')
                            }}
                            disabled={revokingAll}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                              border: '1px solid #ef4444', background: 'transparent',
                              color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            }}
                          >
                            {revokingAll ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={14} />}
                            注销所有其他设备
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== 外观与语言 ===== */}
          {tab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 20px' }}>外观与语言</h2>

              {/* 主题 */}
              <SectionTitle>主题模式</SectionTitle>
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

              {/* 语言 */}
              <SectionTitle>显示语言</SectionTitle>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {([
                  { value: 'zh-CN' as Locale, label: '简体中文', sub: 'Chinese Simplified' },
                  { value: 'en-US' as Locale, label: 'English', sub: 'US English' },
                ]).map(opt => (
                  <div key={opt.value} onClick={() => setLocale(opt.value)}
                    style={{
                      flex: '1 1 140px', padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: locale === opt.value ? '2px solid var(--brand)' : '2px solid var(--border-primary)',
                      background: locale === opt.value ? 'var(--bg-selected)' : 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                    }}>
                    <Globe size={18} style={{ color: locale === opt.value ? 'var(--brand)' : 'var(--text-tertiary)' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: locale === opt.value ? 'var(--brand)' : 'var(--text-heading)' }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{opt.sub}</div>
                    </div>
                    {locale === opt.value && <Check size={14} style={{ color: 'var(--brand)', marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 通知偏好 ===== */}
          {tab === 'notification' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 4px' }}>通知偏好</h2>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 20px' }}>选择你希望接收的通知类型</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {NOTIF_PREFS.map((pref, idx) => (
                  <div key={pref.key} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
                    borderBottom: idx < NOTIF_PREFS.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{pref.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{pref.desc}</div>
                    </div>
                    <ToggleSwitch on={notifPrefs[pref.key] !== false} onToggle={() => toggleNotif(pref.key)} />
                  </div>
                ))}
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

function ChangePasswordBlock({ phone, form, setForm, sending, cooldown, saving, devCode, onSendCode, onSubmit }: {
  phone: string
  form: { code: string; newPwd: string; confirmPwd: string }
  setForm: (f: { code: string; newPwd: string; confirmPwd: string }) => void
  sending: boolean
  cooldown: number
  saving: boolean
  devCode: string
  onSendCode: () => void
  onSubmit: () => void
}) {
  const masked = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Smartphone size={14} style={{ color: 'var(--text-tertiary)' }} />
        验证手机号 <strong style={{ color: 'var(--text-heading)' }}>{masked}</strong> 后修改密码
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
