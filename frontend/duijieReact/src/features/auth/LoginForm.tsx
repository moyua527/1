import { useState } from 'react'
import { authApi } from './services/api'
import { setToken, setRefreshToken } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { KeyRound, Mail } from 'lucide-react'
import { EMAIL_REGEX, useCountdown, useAgreement, AgreementCheckbox, TermsModal } from './shared'

interface LoginFormProps {
  onLogin: (user: any) => void
  onSwitchToForgot: () => void
}

export default function LoginForm({ onLogin, onSwitchToForgot }: LoginFormProps) {
  const [loginMode, setLoginMode] = useState<'password' | 'email'>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const { count, start: startCountdown, active: counting } = useCountdown()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { agreed, setAgreed, showTerms, setShowTerms, check: checkAgreement } = useAgreement()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await checkAgreement())) return
    setError(''); setSuccess(''); setLoading(true)
    try {
      const res = await authApi.login(username, password)
      if (res.success) { if (res.token) setToken(res.token); if (res.refresh_token) setRefreshToken(res.refresh_token); onLogin(res.data) }
      else setError(res.message || '登录失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  const handleSendCode = async () => {
    setError(''); setSuccess('')
    if (!EMAIL_REGEX.test(email)) { setError('请输入正确的邮箱地址'); return }
    try {
      const res = await authApi.sendCode('email', email)
      if (res.success) { startCountdown(60); setSuccess('验证码已发送到邮箱'); setTimeout(() => setSuccess(''), 5000) }
      else setError(res.message || '发送失败')
    } catch { setError('网络错误') }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await checkAgreement())) return
    if (!email.trim()) { setError('请输入邮箱'); return }
    if (!code || code.length < 4) { setError('请输入验证码'); return }
    setError(''); setSuccess(''); setLoading(true)
    try {
      const res = await authApi.loginByCode('email', email, code)
      if (res.success) { if (res.token) setToken(res.token); if (res.refresh_token) setRefreshToken(res.refresh_token); onLogin(res.data) }
      else setError(res.message || '登录失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  const switchMode = (m: 'password' | 'email') => { setLoginMode(m); setError(''); setSuccess('') }

  const feedbackBlock = (
    <>
      {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center' }}>{error}</div>}
      {success && <div style={{ color: 'var(--color-success)', fontSize: 13, textAlign: 'center' }}>{success}</div>}
    </>
  )

  return (
    <>
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border-primary)' }}>
        {([
          { key: 'password' as const, label: '账号密码', icon: <KeyRound size={14} /> },
          { key: 'email' as const, label: '邮箱登录', icon: <Mail size={14} /> },
        ]).map(m => (
          <button key={m.key} type="button" onClick={() => switchMode(m.key)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              color: loginMode === m.key ? 'var(--brand)' : 'var(--text-tertiary)', background: 'transparent',
              borderBottom: loginMode === m.key ? '2px solid var(--brand)' : '2px solid transparent', transition: 'all 0.15s' }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {loginMode === 'password' && (
        <form onSubmit={handlePasswordLogin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="账号" placeholder="用户名 / 手机号 / ID" value={username} onChange={e => setUsername(e.target.value)} />
            <Input label="密码" type="password" placeholder="输入密码" value={password} onChange={e => setPassword(e.target.value)} />
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <span onClick={onSwitchToForgot} style={{ fontSize: 12, color: 'var(--brand)', cursor: 'pointer' }}>忘记密码？</span>
            </div>
            {feedbackBlock}
            <AgreementCheckbox agreed={agreed} onChange={setAgreed} onShowTerms={() => setShowTerms(true)} />
            <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', marginTop: 4 }} disabled={loading}>
              {loading ? '登录中...' : '登 录'}
            </Button>
          </div>
        </form>
      )}

      {loginMode === 'email' && (
        <form onSubmit={handleEmailLogin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="邮箱" placeholder="输入邮箱地址" value={email} onChange={e => setEmail(e.target.value)} />
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>验证码</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="输入6位验证码" value={code} onChange={e => setCode(e.target.value)} maxLength={6}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')} />
                <button type="button" disabled={counting} onClick={handleSendCode}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: counting ? 'var(--border-primary)' : 'var(--brand)', color: counting ? 'var(--text-tertiary)' : 'var(--bg-primary)', fontSize: 13, fontWeight: 500, cursor: counting ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                  {counting ? `${count}s` : '获取验证码'}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <span onClick={onSwitchToForgot} style={{ fontSize: 12, color: 'var(--brand)', cursor: 'pointer' }}>忘记密码？</span>
            </div>
            {feedbackBlock}
            <AgreementCheckbox agreed={agreed} onChange={setAgreed} onShowTerms={() => setShowTerms(true)} />
            <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', marginTop: 4 }} disabled={loading}>
              {loading ? '登录中...' : '登 录'}
            </Button>
          </div>
        </form>
      )}

      {showTerms && <TermsModal onClose={agree => { setShowTerms(false); if (agree) setAgreed(true) }} />}
    </>
  )
}
