import { useState } from 'react'
import { authApi } from './services/api'
import { setToken } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface LoginFormProps {
  onLogin: (user: any) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <form onSubmit={handleLogin}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="账号" placeholder="输入用户名" value={username} onChange={e => setUsername(e.target.value)} />
        <Input label="密码" type="password" placeholder="输入密码" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center' }}>{error}</div>}

        <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', marginTop: 4 }} disabled={loading}>
          {loading ? '登录中...' : '登 录'}
        </Button>
      </div>
    </form>
  )
}
