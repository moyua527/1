import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Loader2, UserPlus, Mail, Lock, User } from 'lucide-react'
import { authApi } from './services/api'
import { setToken, setRefreshToken, fetchApi } from '../../bootstrap'
import useUserStore from '../../stores/useUserStore'
import Avatar from '../ui/Avatar'
import Input from '../ui/Input'
import Button from '../ui/Button'

type Step = 'welcome' | 'register' | 'success'

interface InviteData {
  inviter_name: string | null
  inviter_avatar: string | null
}

export default function InviteLandingPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, init } = useUserStore()

  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(true)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [inviteError, setInviteError] = useState('')

  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) { setInviteError('链接无效'); setLoading(false); return }
    fetchApi(`/api/invite-links/${token}/validate`).then(r => {
      setLoading(false)
      if (r.success) setInviteData(r.data)
      else setInviteError(r.message || '邀请链接无效或已过期')
    }).catch(() => { setLoading(false); setInviteError('网络错误') })
  }, [token])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (step === 'success') {
      const t = setTimeout(() => { init(); navigate('/', { replace: true }) }, 2000)
      return () => clearTimeout(t)
    }
  }, [step, init, navigate])

  const handleSendCode = async () => {
    setError(''); setSuccess('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('请输入正确的邮箱地址'); return }
    const res = await authApi.sendCode('email', email)
    if (res.success) { setCountdown(60); setSuccess('验证码已发送') }
    else setError(res.message || '发送失败')
  }

  const handleVerifyCode = async () => {
    setError(''); setSuccess('')
    if (!emailCode || emailCode.length < 4) { setError('请输入验证码'); return }
    const res = await authApi.verifyCode('email', email, emailCode)
    if (res.success) { setEmailVerified(true); setSuccess('邮箱验证成功') }
    else setError(res.message || '验证码无效')
  }

  const handleRegister = async () => {
    setError('')
    if (!email.trim() || !emailVerified) { setError('请先验证邮箱'); return }
    if (!nickname.trim()) { setError('请输入姓名'); return }
    if (password.length < 8) { setError('密码至少8位'); return }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) { setError('密码需包含字母和数字'); return }
    if (password !== confirmPwd) { setError('两次密码不一致'); return }
    if (!agreed) { setError('请先同意服务协议'); return }
    setSubmitting(true)
    const res = await authApi.register({ email: email.trim(), nickname: nickname.trim(), password, invite_token: token })
    setSubmitting(false)
    if (res.success) {
      if (res.token) { setToken(res.token); if (res.refresh_token) setRefreshToken(res.refresh_token) }
      setStep('success')
    } else setError(res.message || '注册失败')
  }

  if (loading) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 size={32} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 12, color: 'var(--text-tertiary)', fontSize: 14 }}>验证邀请链接...</div>
        </div>
      </PageShell>
    )
  }

  if (inviteError) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: 28 }}>!</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>链接无效</h2>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 24 }}>{inviteError}</p>
          <Button onClick={() => navigate('/', { replace: true })}>返回首页</Button>
        </div>
      </PageShell>
    )
  }

  if (user) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Avatar name={user.nickname || user.username} size={64} src={user.avatar || undefined} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', margin: '16px 0 8px' }}>你已登录</h2>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 24 }}>当前账号：{user.nickname || user.username}</p>
          <Button onClick={() => navigate('/', { replace: true })}>进入工作台</Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {step === 'welcome' && (
        <div style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, var(--brand) 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}>
            <UserPlus size={36} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>加入 DuiJie</h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 32, lineHeight: 1.6 }}>
            {inviteData?.inviter_name
              ? <><strong style={{ color: 'var(--text-heading)' }}>{inviteData.inviter_name}</strong> 邀请你加入 DuiJie 协作平台</>
              : '你被邀请加入 DuiJie 协作平台'}
          </p>

          {inviteData?.inviter_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 32, justifyContent: 'center' }}>
              <Avatar name={inviteData.inviter_name} size={40} src={inviteData.inviter_avatar || undefined} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{inviteData.inviter_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>邀请人</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button onClick={() => setStep('register')} style={{ width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 16 }}>
              <ArrowRight size={18} /> 立即注册
            </Button>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              已有账号？
              <span onClick={() => navigate('/')} style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}> 直接登录</span>
            </div>
          </div>
        </div>
      )}

      {step === 'register' && (
        <div style={{ padding: '24px 24px 32px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4, textAlign: 'center' }}>创建账号</h2>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24, textAlign: 'center' }}>填写以下信息完成注册</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email verification */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <Mail size={14} /> 邮箱
              </label>
              {emailVerified ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #22c55e' }}>
                  <CheckCircle size={16} color="#22c55e" />
                  <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>{email} 已验证</span>
                  <span onClick={() => { setEmailVerified(false); setEmailCode('') }} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer' }}>更换</span>
                </div>
              ) : (
                <>
                  <Input placeholder="你的邮箱地址" value={email} onChange={e => setEmail(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input placeholder="6位验证码" value={emailCode} onChange={e => setEmailCode(e.target.value)} maxLength={6}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')} />
                    <button type="button" disabled={countdown > 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} onClick={handleSendCode}
                      style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: countdown > 0 ? 'var(--border-primary)' : 'var(--brand)', color: countdown > 0 ? 'var(--text-tertiary)' : '#fff', fontSize: 12, fontWeight: 500, cursor: countdown > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                      {countdown > 0 ? `${countdown}s` : '发送'}
                    </button>
                    {emailCode.length >= 4 && (
                      <button type="button" onClick={handleVerifyCode}
                        style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        验证
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <User size={14} /> 姓名
              </label>
              <Input placeholder="你的姓名或昵称" value={nickname} onChange={e => setNickname(e.target.value)} />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <Lock size={14} /> 设置密码
              </label>
              <Input type="password" placeholder="至少8位，包含字母和数字" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {password && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>确认密码</label>
                <Input type="password" placeholder="再次输入密码" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            )}

            {error && <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</div>}
            {success && <div style={{ color: '#22c55e', fontSize: 13, textAlign: 'center' }}>{success}</div>}

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

            <Button onClick={handleRegister} disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', padding: '13px 0', marginTop: 4 }}>
              {submitting ? '注册中...' : '注册并加入'}
            </Button>

            <div style={{ textAlign: 'center' }}>
              <span onClick={() => setStep('welcome')} style={{ fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer' }}>返回</span>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>注册成功</h2>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 8 }}>欢迎加入 DuiJie 协作平台</p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>正在跳转到工作台...</p>
          <Loader2 size={20} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite', marginTop: 16 }} />
        </div>
      )}

      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={() => setShowTerms(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: '28px 24px', width: 520, maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16, textAlign: 'center' }}>用户服务协议与隐私保护政策</h2>
            <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '16px 0 8px' }}>一、服务协议</h3>
              <p>1. 本平台（DuiJie 对接平台）为用户提供项目管理、客户管理、任务协作、文件交付、即时通讯等服务。</p>
              <p>2. 用户应如实填写注册信息，对账号安全负责，不得将账号转让或借于他人使用。</p>
              <p>3. 用户不得利用本平台从事违法违规活动，不得侵犯他人合法权益。</p>
              <p>4. 本平台有权对违反协议的用户采取限制或禁止使用等措施。</p>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '16px 0 8px' }}>二、隐私保护政策</h3>
              <p>1. 我们收集的信息仅用于提供和改进服务，不会出售或出租您的个人信息。</p>
              <p>2. 您的密码经过加密存储，我们采用行业标准的安全措施保护您的数据。</p>
              <p>3. 您有权查看、修改或删除您的个人信息。</p>
              <p>4. 我们可能会使用 Cookie 和类似技术来改善用户体验和安全性。</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => { setShowTerms(false); setAgreed(true) }}
                style={{ padding: '10px 40px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                我已阅读并同意
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f1f5f9 50%, #faf5ff 100%)',
      padding: 16, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    }}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 20, width: 440, maxWidth: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)', overflow: 'hidden',
      }}>
        <div style={{ padding: '24px 24px 12px', textAlign: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-secondary)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)', letterSpacing: -0.5 }}>DuiJie</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>项目对接协作平台</div>
        </div>
        {children}
      </div>
    </div>
  )
}
