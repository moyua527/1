import { useState, useEffect } from 'react'
import { authApi } from './services/api'
import { setToken, fetchApi } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { confirm } from '../ui/ConfirmDialog'
import { CheckCircle } from 'lucide-react'

interface RegisterFormProps {
  onRegistered: (user: any) => void
  onSwitchToLogin: () => void
  inviteToken: string
}

export default function RegisterForm({ onRegistered, onSwitchToLogin, inviteToken: inviteTokenProp }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
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
        setSuccess('邮箱验证成功')
        setTimeout(() => setSuccess(''), 3000)
      } else setError(res.message || '验证码无效')
    } catch { setError('网络错误') }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) {
      const ok = await confirm({ title: '服务协议', message: '注册前需同意《用户服务协议》和《隐私保护政策》，是否同意并继续？', confirmText: '同意并注册', cancelText: '取消' })
      if (!ok) return
      setAgreed(true)
    }
    setError(''); setSuccess('')
    if (!email.trim()) { setError('请输入邮箱地址'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('请输入正确的邮箱地址'); return }
    if (!emailVerified) { setError('请先验证邮箱'); return }
    setLoading(true)
    try {
      const res = await authApi.register({
        email: email.trim(),
        invite_token: inviteToken || undefined,
      })
      if (res.success) {
        if (res.token) { setToken(res.token); onRegistered(res.data) }
        else { setTimeout(() => onSwitchToLogin(), 1500) }
      } else setError(res.message || '注册失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  return (
    <>
      <form onSubmit={handleRegister}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
              邮箱账号
            </label>
            {emailVerified ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-success, #f0fdf4)', border: '1px solid var(--color-success, #22c55e)' }}>
                <CheckCircle size={16} color="var(--color-success, #22c55e)" />
                <span style={{ fontSize: 13, color: 'var(--color-success, #22c55e)', fontWeight: 500 }}>{email} 已验证</span>
                <span onClick={() => { setEmailVerified(false); setEmailCode('') }} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer' }}>更换</span>
              </div>
            ) : (
              <>
                <Input placeholder="输入邮箱地址" value={email} onChange={e => { setEmail(e.target.value); setEmailVerified(false) }} />
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, marginTop: 12 }}>
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
                  {emailCode.length >= 4 && (
                    <button type="button" onClick={handleVerifyEmail}
                      style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--color-success, #22c55e)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      验证
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: 'var(--color-success)', fontSize: 13, textAlign: 'center' }}>{success}</div>}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: 3, accentColor: 'var(--brand)', width: 16, height: 16, cursor: 'pointer' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              我已阅读并同意{' '}
              <span onClick={e => { e.preventDefault(); setShowTerms(true) }} style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>《用户服务协议》</span>
              {' '}和{' '}
              <span onClick={e => { e.preventDefault(); setShowTerms(true) }} style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>《隐私保护政策》</span>
            </span>
          </label>

          <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', marginTop: 4 }} disabled={loading}>
            {loading ? '注册中...' : '注 册'}
          </Button>
        </div>
      </form>

      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={() => setShowTerms(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: '28px 24px', width: 520, maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16, textAlign: 'center' }}>用户服务协议与隐私保护政策</h2>
            <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.8 }}>
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
