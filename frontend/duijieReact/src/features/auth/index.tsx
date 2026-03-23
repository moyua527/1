import { useState, useEffect, useMemo } from 'react'
import { authApi } from './services/api'
import { setToken, fetchApi } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Lock, Mail, Phone, Link2, Clock } from 'lucide-react'
import { areaData } from '../../data/areaCode'

interface Props { onLogin: (user: any) => void }

const getPwdStrength = (pwd: string) => {
  if (!pwd) return { level: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  if (score <= 1) return { level: 1, label: '弱', color: '#dc2626' }
  if (score <= 3) return { level: 2, label: '中', color: '#d97706' }
  return { level: 3, label: '强', color: '#16a34a' }
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }
const selectStyle: React.CSSProperties = { flex: 1, padding: '8px 6px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone' | 'email'>('password')
  const [regMethod, setRegMethod] = useState<'phone' | 'email'>('phone')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [gender, setGender] = useState('')
  const [userType, setUserType] = useState<'individual' | 'company'>('individual')
  const [position, setPosition] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [needInvite, setNeedInvite] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteToken, setInviteToken] = useState('')
  const [inviteLinkRole, setInviteLinkRole] = useState('')
  const [needApproval, setNeedApproval] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    authApi.registerConfig().then(r => { if (r.success) setNeedInvite(r.data?.needInviteCode || false) })
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')
    if (token) {
      setInviteToken(token)
      setMode('register')
      fetchApi(`/api/invite-links/${token}/validate`).then(r => {
        if (r.success) setInviteLinkRole(r.data.preset_role)
        else { setError('邀请链接无效或已过期'); setInviteToken('') }
      })
    }
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const resetForm = () => { setUsername(''); setPassword(''); setConfirmPwd(''); setNickname(''); setEmail(''); setPhone(''); setVerifyCode(''); setInviteCode(''); setGender(''); setUserType('individual'); setPosition(''); setProvince(''); setCity(''); setError(''); setSuccess('') }

  const cities = useMemo(() => province && areaData[province]?.children ? areaData[province].children : {}, [province])
  const provinceName = province ? areaData[province]?.name || '' : ''
  const cityName = city ? cities[city]?.name || '' : ''
  const areaCode = province && city ? province + city + '01' : ''
  const switchMode = (m: 'login' | 'register') => { setMode(m); resetForm(); setLoginMethod('password'); setRegMethod('phone') }

  const handleSendCode = async () => {
    setError('')
    const type = loginMethod === 'phone' ? 'phone' as const : 'email' as const
    const target = loginMethod === 'phone' ? phone : email
    if (loginMethod === 'phone' && !/^\d{11}$/.test(target)) { setError('请输入正确的11位手机号'); return }
    if (loginMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) { setError('请输入正确的邮箱'); return }
    const res = await authApi.sendCode(type, target)
    if (res.success) { setCountdown(60); setSuccess('验证码已发送'); setTimeout(() => setSuccess(''), 3000) }
    else setError(res.message || '发送失败')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (loginMethod === 'password') {
        const res = await authApi.login(username, password)
        if (res.success) { if (res.token) setToken(res.token); onLogin(res.data) }
        else setError(res.message || '登录失败')
      } else {
        const type = loginMethod === 'phone' ? 'phone' as const : 'email' as const
        const target = loginMethod === 'phone' ? phone : email
        if (!target) { setError(loginMethod === 'phone' ? '请输入手机号' : '请输入邮箱'); setLoading(false); return }
        if (!verifyCode) { setError('请输入验证码'); setLoading(false); return }
        const res = await authApi.loginByCode(type, target, verifyCode)
        if (res.success) { if (res.token) setToken(res.token); onLogin(res.data) }
        else setError(res.message || '登录失败')
      }
    } catch { setError('网络错误') }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (regMethod === 'phone') {
      if (!phone.trim() || !/^\d{11}$/.test(phone.trim())) { setError('请输入正确的11位手机号'); return }
    } else {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('请输入正确的邮箱地址'); return }
    }
    if (!nickname.trim()) { setError('请输入昵称'); return }
    if (!gender) { setError('请选择性别'); return }
    if (!province || !city) { setError('请选择省份和城市'); return }
    if (userType === 'company' && !position.trim()) { setError('企业用户请填写职位'); return }
    if (!password || password.length < 6) { setError('密码至少6个字符'); return }
    if (password !== confirmPwd) { setError('两次密码不一致'); return }
    if (!inviteToken && !inviteCode.trim()) { setError('请输入邀请码'); return }
    setLoading(true)
    try {
      const autoUsername = regMethod === 'phone' ? phone.trim() : email.trim().split('@')[0] + '_' + Date.now().toString(36)
      const res = await authApi.register({
        username: autoUsername, password, nickname: nickname.trim(),
        email: regMethod === 'email' ? email.trim() : undefined,
        phone: regMethod === 'phone' ? phone.trim() : undefined,
        gender: Number(gender), area_code: areaCode,
        user_type: userType, province: provinceName, city: cityName,
        position: userType === 'company' ? position.trim() : undefined,
        invite_code: inviteToken ? undefined : (inviteCode.trim() || undefined),
        invite_token: inviteToken || undefined,
      })
      if (res.success) {
        if (res.needApproval) {
          setNeedApproval(true)
          setSuccess('注册成功！请等待管理员审批后方可登录')
        } else {
          setSuccess('注册成功！即将跳转登录...')
          setTimeout(() => switchMode('login'), 1500)
        }
      } else setError(res.message || '注册失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  const pwdStrength = getPwdStrength(password)

  const loginMethods = [
    { key: 'password' as const, label: '账号密码', icon: <Lock size={14} /> },
    { key: 'phone' as const, label: '手机验证码', icon: <Phone size={14} /> },
    { key: 'email' as const, label: '邮箱验证码', icon: <Mail size={14} /> },
  ]

  const pillStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
    background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#94a3b8',
    fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f1f5f9 50%, #faf5ff 100%)', padding: 16, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: 420, maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1e40af', letterSpacing: -0.5 }}>DuiJie</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>项目对接平台</div>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 20 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#0f172a' : '#64748b',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        {mode === 'login' && (
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
            {loginMethods.map(m => (
              <button key={m.key} type="button" onClick={() => { setLoginMethod(m.key); setError(''); setVerifyCode('') }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  color: loginMethod === m.key ? '#2563eb' : '#94a3b8', background: 'transparent',
                  borderBottom: loginMethod === m.key ? '2px solid #2563eb' : '2px solid transparent', transition: 'all 0.15s' }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'register' && (
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
            {([{ key: 'phone' as const, label: '手机号注册', icon: <Phone size={14} /> }, { key: 'email' as const, label: '邮箱注册', icon: <Mail size={14} /> }]).map(m => (
              <button key={m.key} type="button" onClick={() => { setRegMethod(m.key); setError('') }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  color: regMethod === m.key ? '#2563eb' : '#94a3b8', background: 'transparent',
                  borderBottom: regMethod === m.key ? '2px solid #2563eb' : '2px solid transparent', transition: 'all 0.15s' }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'login' && loginMethod === 'password' && (
            <>
              <Input label="用户名" placeholder="输入用户名/手机号" value={username} onChange={e => setUsername(e.target.value)} />
              <Input label="密码" type="password" placeholder="输入密码" value={password} onChange={e => setPassword(e.target.value)} />
            </>
          )}

          {mode === 'login' && loginMethod === 'phone' && (
            <>
              <Input label="手机号" placeholder="输入手机号" value={phone} onChange={e => setPhone(e.target.value)} />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>验证码</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="输入6位验证码" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')} onBlur={e => (e.currentTarget.style.borderColor = '#cbd5e1')} />
                  <button type="button" disabled={countdown > 0} onClick={handleSendCode}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: countdown > 0 ? '#e2e8f0' : '#2563eb', color: countdown > 0 ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 500, cursor: countdown > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'login' && loginMethod === 'email' && (
            <>
              <Input label="邮箱" placeholder="输入邮箱地址" value={email} onChange={e => setEmail(e.target.value)} />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>验证码</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="输入6位验证码" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')} onBlur={e => (e.currentTarget.style.borderColor = '#cbd5e1')} />
                  <button type="button" disabled={countdown > 0} onClick={handleSendCode}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: countdown > 0 ? '#e2e8f0' : '#2563eb', color: countdown > 0 ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 500, cursor: countdown > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <>
              {regMethod === 'phone' && (
                <Input label="手机号 *" placeholder="输入11位手机号" value={phone} onChange={e => setPhone(e.target.value)} />
              )}
              {regMethod === 'email' && (
                <Input label="邮箱 *" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              )}
              <Input label="昵称 *" placeholder="输入你的昵称" value={nickname} onChange={e => setNickname(e.target.value)} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>性别 *</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[{ v: '1', l: '男' }, { v: '2', l: '女' }].map(g => (
                      <button key={g.v} type="button" onClick={() => setGender(g.v)} style={pillStyle(gender === g.v)}>
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>类型 *</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" onClick={() => { setUserType('individual'); setPosition('') }} style={pillStyle(userType === 'individual')}>
                      个人
                    </button>
                    <button type="button" onClick={() => setUserType('company')} style={pillStyle(userType === 'company')}>
                      企业
                    </button>
                  </div>
                </div>
              </div>
              {userType === 'company' && (
                <Input label="职位 *" placeholder="如：产品经理、技术总监" value={position} onChange={e => setPosition(e.target.value)} />
              )}
              <div>
                <label style={labelStyle}>所在地 *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={province} onChange={e => { setProvince(e.target.value); setCity('') }} style={selectStyle}>
                    <option value="">省份</option>
                    {Object.entries(areaData).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                  <select value={city} onChange={e => setCity(e.target.value)} style={selectStyle} disabled={!province}>
                    <option value="">城市</option>
                    {Object.entries(cities).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <Input label="密码 *" type="password" placeholder="至少6个字符" value={password} onChange={e => setPassword(e.target.value)} />
              {password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwdStrength.level ? pwdStrength.color : '#e2e8f0', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: pwdStrength.color, fontWeight: 500 }}>{pwdStrength.label}</span>
                </div>
              )}
              <Input label="确认密码 *" type="password" placeholder="再次输入密码" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              {inviteToken && inviteLinkRole && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Link2 size={16} style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: 13, color: '#15803d' }}>通过邀请链接注册，预设角色：<strong>{inviteLinkRole}</strong>，注册后直接激活</span>
                </div>
              )}
              {!inviteToken && (
                <Input label="邀请码 *" placeholder="输入系统邀请码或他人专属邀请码" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} />
              )}
            </>
          )}

          {error && <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{error}</div>}
          {success && <div style={{ color: '#16a34a', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{success}</div>}

          <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }} disabled={loading}>
            {loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登 录' : '注 册')}
          </Button>
        </div>

        {mode === 'register' && needApproval && (
          <div style={{ marginTop: 16, textAlign: 'center', padding: '12px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
            <Clock size={20} style={{ color: '#d97706', margin: '0 auto 6px' }} />
            <div style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>注册成功，等待管理员审批</div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>审批通过后即可登录使用系统</div>
          </div>
        )}
        {mode === 'register' && !needApproval && !inviteToken && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            系统邀请码注册需管理员审批 · 个人邀请码注册直接激活
          </div>
        )}
      </form>
    </div>
  )
}
