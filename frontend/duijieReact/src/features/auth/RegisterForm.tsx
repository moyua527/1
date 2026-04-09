import { useState, useEffect } from 'react'
import { authApi } from './services/api'
import { setToken, setRefreshToken, fetchApi } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { confirm } from '../ui/ConfirmDialog'
import { CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'

interface RegisterFormProps {
  onRegistered: (user: any) => void
  onSwitchToLogin: () => void
  inviteToken: string
}

export default function RegisterForm({ onRegistered, onSwitchToLogin, inviteToken: inviteTokenProp }: RegisterFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [nickname, setNickname] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [inviteToken, setInviteToken] = useState(inviteTokenProp)

  useEffect(() => {
    if (inviteTokenProp) {
      fetchApi(`/api/invite-links/${inviteTokenProp}/validate`).then(r => {
        if (!r.success) { setError('邀请链接无效或已过期'); setInviteToken('') }
      })
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (emailCode.length === 6 && email && !emailVerified) {
      handleVerifyEmail()
    }
  }, [emailCode])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendEmailCode = async () => {
    setError(''); setSuccess('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('请输入正确的邮箱地址'); return }
    try {
      const res = await authApi.sendCode('email', email)
      if (res.success) {
        setCountdown(60)
        setSuccess('验证码已发送到邮箱')
        setTimeout(() => setSuccess(''), 5000)
      } else setError(res.message || '发送失败')
    } catch { setError('网络错误') }
  }

  const handleVerifyEmail = async () => {
    setError(''); setSuccess('')
    if (!emailCode || emailCode.length < 4) { setError('请输入验证码'); return }
    try {
      const res = await authApi.verifyCode('email', email, emailCode)
      if (res.success) {
        setEmailVerified(true)
        setError(''); setSuccess('')
        setStep(2)
      } else setError(res.message || '验证码无效或已过期')
    } catch { setError('网络错误') }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!nickname.trim()) { setError('请输入昵称'); return }
    if (nickname.trim().length < 2 || nickname.trim().length > 6) { setError('昵称需要2~6个字符'); return }
    if (!regUsername.trim()) { setError('请输入用户名'); return }
    if (!/^[a-zA-Z0-9]{3,20}$/.test(regUsername.trim())) { setError('用户名只能包含英文和数字，3~20个字符'); return }
    if (!password) { setError('请输入密码'); return }
    if (password.length < 8) { setError('密码至少8位'); return }
    if (!/^[a-zA-Z0-9]+$/.test(password)) { setError('密码只能包含英文和数字'); return }
    if (password !== confirmPw) { setError('两次输入的密码不一致'); return }
    if (!agreed) {
      const ok = await confirm({ title: '服务协议', message: '注册前需同意《用户服务协议》和《隐私保护政策》，是否同意并继续？', confirmText: '同意并继续', cancelText: '取消' })
      if (!ok) return
      setAgreed(true)
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        email: email.trim(),
        nickname: nickname.trim(),
        username: regUsername.trim(),
        password,
        invite_token: inviteToken || undefined,
      })
      if (res.success) {
        if (res.token) { setToken(res.token); if (res.refresh_token) setRefreshToken(res.refresh_token); onRegistered(res.data) }
        else { setTimeout(() => onSwitchToLogin(), 1500) }
      } else setError(res.message || '注册失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  // Step 2: Set username & password
  if (step === 2) {
    return (
      <form onSubmit={handleRegister}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div onClick={() => { setStep(1); setError(''); setSuccess('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13 }}>
            <ArrowLeft size={16} /> 返回上一步
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-success, #f0fdf4)', border: '1px solid var(--color-success, #22c55e)' }}>
            <CheckCircle size={16} color="var(--color-success, #22c55e)" />
            <span style={{ fontSize: 13, color: 'var(--color-success, #22c55e)', fontWeight: 500 }}>{email} 已验证</span>
          </div>

          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', textAlign: 'center' }}>
            设置用户名和密码
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
              昵称
            </label>
            <Input placeholder="显示给其他用户，2~6个字符" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={6} autoFocus />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
              用户名
            </label>
            <Input placeholder="登录用，英文和数字，3~20个字符" value={regUsername}
              onChange={e => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} maxLength={20} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
              设置密码
            </label>
            <div style={{ position: 'relative' }}>
              <Input type={showPw ? 'text' : 'password'} placeholder="至少8位，英文和数字" value={password}
                onChange={e => setPassword(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} />
              <span onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
              确认密码
            </label>
            <Input type={showPw ? 'text' : 'password'} placeholder="再次输入密码" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>

          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: 'var(--color-success)', fontSize: 13, textAlign: 'center' }}>{success}</div>}

          <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', marginTop: 4 }} disabled={loading}>
            {loading ? '注册中...' : '完成注册'}
          </Button>
        </div>
      </form>
    )
  }

  // Step 1: Email verification
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
          邮箱账号
        </label>
        <Input placeholder="输入邮箱地址" value={email} onChange={e => { setEmail(e.target.value); setEmailVerified(false) }} />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
          邮箱验证码
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="输入6位验证码" value={emailCode} onChange={e => setEmailCode(e.target.value)} maxLength={6}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')} />
          <button type="button" disabled={countdown > 0 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} onClick={handleSendEmailCode}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: (countdown > 0 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? 'var(--border-primary)' : 'var(--brand)', color: (countdown > 0 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? 'var(--text-tertiary)' : 'var(--bg-primary)', fontSize: 12, fontWeight: 500, cursor: (countdown > 0 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
            {countdown > 0 ? `${countdown}s` : '发送'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>输入验证码后自动进入下一步</div>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center' }}>{error}</div>}
      {success && <div style={{ color: 'var(--color-success)', fontSize: 13, textAlign: 'center' }}>{success}</div>}
    </div>
  )
}
