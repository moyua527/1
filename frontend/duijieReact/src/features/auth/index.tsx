import { useState, useEffect } from 'react'
import { fetchApi } from '../../bootstrap'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import { ArrowLeft, KeyRound } from 'lucide-react'

interface Props { onLogin: (user: any) => void }

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [inviteToken, setInviteToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')
    if (token) {
      setInviteToken(token)
      setMode('register')
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f1f5f9 50%, #faf5ff 100%)', padding: 16, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: '36px 32px', width: 420, maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)', letterSpacing: -0.5 }}>DuiJie</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>项目对接平台</div>
        </div>

        {mode !== 'forgot' ? (
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3, marginBottom: 20 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  background: mode === m ? 'var(--bg-primary)' : 'transparent', color: mode === m ? 'var(--text-heading)' : 'var(--text-secondary)',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <button type="button" onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, padding: 0 }}>
              <ArrowLeft size={16} /> 返回登录
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>
              <KeyRound size={16} style={{ verticalAlign: -3, marginRight: 4 }} />找回密码
            </div>
          </div>
        )}

        {mode === 'login' && <LoginForm onLogin={onLogin} onSwitchToForgot={() => setMode('forgot')} />}
        {mode === 'register' && <RegisterForm onRegistered={onLogin} onSwitchToLogin={() => setMode('login')} inviteToken={inviteToken} />}
        {mode === 'forgot' && <ForgotPasswordForm onBack={() => setMode('login')} />}
      </div>
    </div>
  )
}
