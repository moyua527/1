import { useState, useEffect } from 'react'
import { authApi } from './services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Mail, Phone, ArrowRight, CheckCircle } from 'lucide-react'

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

interface ForgotPasswordFormProps {
  onBack: () => void
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotMethod, setForgotMethod] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPwd, setConfirmNewPwd] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleForgotSendCode = async () => {
    setError('')
    const type = forgotMethod
    const target = forgotMethod === 'phone' ? phone : email
    if (forgotMethod === 'phone' && !/^\d{11}$/.test(target)) { setError('请输入正确的11位手机号'); return }
    if (forgotMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) { setError('请输入正确的邮箱'); return }
    const res = await authApi.forgotPassword(type, target)
    if (res.success) { setCountdown(60); setSuccess(res._dev_code ? `验证码: ${res._dev_code}（测试模式）` : '验证码已发送'); if (res._dev_code) setVerifyCode(res._dev_code); setTimeout(() => setSuccess(''), 8000) }
    else setError(res.message || '发送失败')
  }

  const handleForgotNext = async () => {
    setError('')
    const type = forgotMethod
    const target = forgotMethod === 'phone' ? phone : email
    if (!target) { setError(forgotMethod === 'phone' ? '请输入手机号' : '请输入邮箱'); return }
    if (!verifyCode || verifyCode.length < 4) { setError('请输入验证码'); return }
    setVerifying(true)
    try {
      const res = await authApi.verifyCode(type, target, verifyCode)
      if (res.success) { setForgotStep(2); setError('') }
      else setError(res.message || '验证码无效')
    } catch { setError('网络错误') }
    setVerifying(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!newPassword || newPassword.length < 6) { setError('密码至少6个字符'); return }
    if (newPassword !== confirmNewPwd) { setError('两次密码不一致'); return }
    setLoading(true)
    try {
      const type = forgotMethod
      const target = forgotMethod === 'phone' ? phone : email
      const res = await authApi.resetPassword(type, target, verifyCode, newPassword)
      if (res.success) { setSuccess('密码重置成功，3秒后跳转登录...'); setTimeout(() => onBack(), 3000) }
      else setError(res.message || '重置失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  return (
    <form onSubmit={handleResetPassword}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {forgotStep === 1 && (
          <>
            <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              {([{ key: 'phone' as const, label: '手机号找回', icon: <Phone size={14} /> }, { key: 'email' as const, label: '邮箱找回', icon: <Mail size={14} /> }]).map(m => (
                <button key={m.key} type="button" onClick={() => { setForgotMethod(m.key); setError(''); setVerifyCode('') }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    color: forgotMethod === m.key ? '#2563eb' : '#94a3b8', background: 'transparent',
                    borderBottom: forgotMethod === m.key ? '2px solid #2563eb' : '2px solid transparent', transition: 'all 0.15s' }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            {forgotMethod === 'phone' && (
              <Input label="手机号 *" placeholder="输入注册时的手机号" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={11} />
            )}
            {forgotMethod === 'email' && (
              <Input label="邮箱 *" placeholder="输入注册时的邮箱" value={email} onChange={e => setEmail(e.target.value)} />
            )}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>验证码 *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="输入6位验证码" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')} onBlur={e => (e.currentTarget.style.borderColor = '#cbd5e1')} />
                <button type="button" disabled={countdown > 0} onClick={handleForgotSendCode}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: countdown > 0 ? '#e2e8f0' : '#2563eb', color: countdown > 0 ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 500, cursor: countdown > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          </>
        )}

        {forgotStep === 2 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 4 }}>
              <CheckCircle size={16} color="#16a34a" />
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
                {forgotMethod === 'phone' ? phone : email} 已验证
              </span>
            </div>
            <Input label="新密码 *" type="password" placeholder="至少6个字符" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            {newPassword && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                  {[1, 2, 3].map(i => {
                    const s = getPwdStrength(newPassword)
                    return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= s.level ? s.color : '#e2e8f0', transition: 'background 0.2s' }} />
                  })}
                </div>
                <span style={{ fontSize: 12, color: getPwdStrength(newPassword).color, fontWeight: 500 }}>{getPwdStrength(newPassword).label}</span>
              </div>
            )}
            <Input label="确认新密码 *" type="password" placeholder="再次输入新密码" value={confirmNewPwd} onChange={e => setConfirmNewPwd(e.target.value)} />
          </>
        )}

        {error && <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{success}</div>}

        {forgotStep === 1 && (
          <Button type="button" onClick={handleForgotNext} style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }} disabled={verifying}>
            {verifying ? '验证中...' : <>下一步 <ArrowRight size={16} /></>}
          </Button>
        )}

        {forgotStep === 2 && (
          <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }} disabled={loading}>
            {loading ? '重置中...' : '重置密码'}
          </Button>
        )}
      </div>
    </form>
  )
}
