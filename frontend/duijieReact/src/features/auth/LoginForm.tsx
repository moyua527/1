import { useState, useEffect } from 'react'
import { authApi } from './services/api'
import { setToken } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { confirm } from '../ui/ConfirmDialog'
import { Lock, Mail, Phone } from 'lucide-react'

interface LoginFormProps {
  onLogin: (user: any) => void
  onSwitchToForgot: () => void
}

export default function LoginForm({ onLogin, onSwitchToForgot }: LoginFormProps) {
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone' | 'email'>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendCode = async () => {
    setError('')
    setSuccess('')
    const type = loginMethod === 'phone' ? 'phone' as const : 'email' as const
    const target = loginMethod === 'phone' ? phone : email
    if (loginMethod === 'phone' && !/^\d{11}$/.test(target)) { setError('请输入正确的11位手机号'); return }
    if (loginMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) { setError('请输入正确的邮箱'); return }
    const res = await authApi.sendCode(type, target)
    if (res.success) { setCountdown(60); setSuccess(res._dev_code ? `验证码: ${res._dev_code}（测试模式）` : '验证码已发送'); if (res._dev_code) setVerifyCode(res._dev_code); setTimeout(() => setSuccess(''), 8000) }
    else { setSuccess(''); setError(res.message || '发送失败') }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) {
      const ok = await confirm({ title: '服务协议', message: '登录前需同意《用户服务协议》和《隐私保护政策》，是否同意并继续？', confirmText: '同意并登录', cancelText: '取消' })
      if (!ok) return
      setAgreed(true)
    }
    setError(''); setSuccess(''); setLoading(true)
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

  const loginMethods = [
    { key: 'password' as const, label: '账号密码', icon: <Lock size={14} /> },
    { key: 'phone' as const, label: '手机验证码', icon: <Phone size={14} /> },
    { key: 'email' as const, label: '邮箱验证码', icon: <Mail size={14} /> },
  ]

  return (
    <>
      <form onSubmit={handleLogin}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border-primary)' }}>
          {loginMethods.map(m => (
            <button key={m.key} type="button" onClick={() => { setLoginMethod(m.key); setError(''); setSuccess(''); setVerifyCode('') }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                color: loginMethod === m.key ? 'var(--brand)' : 'var(--text-tertiary)', background: 'transparent',
                borderBottom: loginMethod === m.key ? '2px solid #2563eb' : '2px solid transparent', transition: 'all 0.15s' }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loginMethod === 'password' && (
            <>
              <Input label="账号" placeholder="输入手机号或账号ID" value={username} onChange={e => setUsername(e.target.value)} />
              <Input label="密码" type="password" placeholder="输入密码" value={password} onChange={e => setPassword(e.target.value)} />
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <span onClick={onSwitchToForgot} style={{ fontSize: 12, color: 'var(--brand)', cursor: 'pointer' }}>忘记密码？</span>
              </div>
            </>
          )}

          {loginMethod === 'phone' && (
            <>
              <Input label="手机号" placeholder="输入11位手机号" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={11} />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>验证码</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="输入6位验证码" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--text-disabled)')} />
                  <button type="button" disabled={countdown > 0} onClick={handleSendCode}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: countdown > 0 ? 'var(--border-primary)' : 'var(--brand)', color: countdown > 0 ? 'var(--text-tertiary)' : 'var(--bg-primary)', fontSize: 13, fontWeight: 500, cursor: countdown > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            </>
          )}

          {loginMethod === 'email' && (
            <>
              <Input label="邮箱" placeholder="输入邮箱地址" value={email} onChange={e => setEmail(e.target.value)} />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>验证码</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="输入6位验证码" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--text-disabled)')} />
                  <button type="button" disabled={countdown > 0} onClick={handleSendCode}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: countdown > 0 ? 'var(--border-primary)' : 'var(--brand)', color: countdown > 0 ? 'var(--text-tertiary)' : 'var(--bg-primary)', fontSize: 13, fontWeight: 500, cursor: countdown > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{error}</div>}
          {success && <div style={{ color: 'var(--color-success)', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{success}</div>}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 4 }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: 3, accentColor: 'var(--brand)', width: 16, height: 16, cursor: 'pointer' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              我已阅读并同意{' '}
              <span onClick={e => { e.preventDefault(); setShowTerms(true) }} style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>《用户服务协议》</span>
              {' '}和{' '}
              <span onClick={e => { e.preventDefault(); setShowTerms(true) }} style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>《隐私保护政策》</span>
            </span>
          </label>

          <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </Button>
        </div>
      </form>

      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={() => setShowTerms(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: '28px 24px', width: 520, maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16, textAlign: 'center' }}>用户服务协议与隐私保护政策</h2>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', margin: '16px 0 8px' }}>一、服务协议</h3>
              <p>1. 本平台（DuiJie 对接平台）为用户提供项目管理、客户管理、任务协作、文件交付、即时通讯等服务。</p>
              <p>2. 用户应如实填写注册信息，对账号安全负责，不得将账号转让或借于他人使用。</p>
              <p>3. 用户不得利用本平台从事违法违规活动，不得侵犯他人合法权益。</p>
              <p>4. 本平台有权对违反协议的用户采取限制或禁止使用等措施。</p>
              <p>5. 本平台保留对服务协议的最终解释权和修改权。</p>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', margin: '16px 0 8px' }}>二、隐私保护政策</h3>
              <p>1. 我们收集的信息仅用于提供和改进服务，不会出售或出租您的个人信息。</p>
              <p>2. 您的密码经过加密存储，我们采用行业标准的安全措施保护您的数据。</p>
              <p>3. 您有权查看、修改或删除您的个人信息，可通过个人设置或联系管理员操作。</p>
              <p>4. 我们可能会使用 Cookie 和类似技术来改善用户体验和安全性。</p>
              <p>5. 如有任何隐私问题，请联系平台管理员。</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => { setShowTerms(false); setAgreed(true) }}
                style={{ padding: '10px 40px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'var(--bg-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                我已阅读并同意
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
