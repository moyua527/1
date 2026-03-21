import { useState } from 'react'
import { authApi } from './services/api'
import { setToken } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface Props { onLogin: (user: any) => void }

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => { setUsername(''); setPassword(''); setConfirmPwd(''); setNickname(''); setError(''); setSuccess('') }
  const switchMode = (m: 'login' | 'register') => { setMode(m); resetForm() }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await authApi.login(username, password)
      if (res.success) { if (res.token) setToken(res.token); onLogin(res.data) }
      else setError(res.message || '登录失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!username.trim() || username.trim().length < 3) { setError('用户名至少3个字符'); return }
    if (!password || password.length < 6) { setError('密码至少6个字符'); return }
    if (password !== confirmPwd) { setError('两次密码不一致'); return }
    setLoading(true)
    try {
      const res = await authApi.register(username.trim(), password, nickname.trim() || username.trim())
      if (res.success) { setSuccess('注册成功！请登录'); setTimeout(() => switchMode('login'), 1500) }
      else setError(res.message || '注册失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: 16, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ background: '#fff', borderRadius: 16, padding: 40, width: 400, maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1e40af', letterSpacing: -0.5 }}>DuiJie</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>项目对接平台</div>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 24 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#0f172a' : '#64748b',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="用户名" placeholder={mode === 'register' ? '至少3个字符' : '输入用户名'} value={username} onChange={e => setUsername(e.target.value)} />
          {mode === 'register' && (
            <Input label="昵称（选填）" placeholder="不填则使用用户名" value={nickname} onChange={e => setNickname(e.target.value)} />
          )}
          <Input label="密码" type="password" placeholder={mode === 'register' ? '至少6个字符' : '输入密码'} value={password} onChange={e => setPassword(e.target.value)} />
          {mode === 'register' && (
            <Input label="确认密码" type="password" placeholder="再次输入密码" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
          )}
          {error && <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: '#16a34a', fontSize: 13, textAlign: 'center' }}>{success}</div>}
          <Button style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }} disabled={loading}>
            {loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登 录' : '注 册')}
          </Button>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
          {mode === 'login' ? '测试账号: admin / admin123' : '注册后默认为成员角色'}
        </div>
      </form>
    </div>
  )
}
