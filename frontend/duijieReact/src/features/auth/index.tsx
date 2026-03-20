import { useState } from 'react'
import { authApi } from './services/api'
import { setToken } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface Props { onLogin: (user: any) => void }

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      if (res.success) { if (res.token) setToken(res.token); onLogin(res.data) }
      else setError(res.message || '登录失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1e40af', letterSpacing: -0.5 }}>DuiJie</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>项目对接平台</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="用户名" placeholder="输入用户名" value={username} onChange={e => setUsername(e.target.value)} />
          <Input label="密码" type="password" placeholder="输入密码" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <Button style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 8 }} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </Button>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
          测试账号: admin / admin123
        </div>
      </form>
    </div>
  )
}
