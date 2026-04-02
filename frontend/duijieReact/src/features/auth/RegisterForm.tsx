import { useState, useEffect } from 'react'
import { authApi } from './services/api'
import { setToken, fetchApi } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface RegisterFormProps {
  onRegistered: (user: any) => void
  onSwitchToLogin: () => void
  inviteToken: string
}

export default function RegisterForm({ onRegistered, onSwitchToLogin, inviteToken: inviteTokenProp }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteToken, setInviteToken] = useState(inviteTokenProp)

  useEffect(() => {
    if (inviteTokenProp) {
      fetchApi(`/api/invite-links/${inviteTokenProp}/validate`).then(r => {
        if (!r.success) { setError('邀请链接无效或已过期'); setInviteToken('') }
      })
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('请输入用户名'); return }
    if (username.trim().length < 2) { setError('用户名至少2位'); return }
    if (!password) { setError('请输入密码'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    if (password !== confirmPwd) { setError('两次密码不一致'); return }
    setLoading(true)
    try {
      const res = await authApi.register({ username: username.trim(), password, invite_token: inviteToken || undefined })
      if (res.success) {
        if (res.token) { setToken(res.token); onRegistered(res.data) }
        else { setTimeout(() => onSwitchToLogin(), 1500) }
      } else setError(res.message || '注册失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  return (
    <form onSubmit={handleRegister}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="用户名" placeholder="2-30位字符" value={username} onChange={e => setUsername(e.target.value)} maxLength={30} />
        <Input label="密码" type="password" placeholder="至少6位" value={password} onChange={e => setPassword(e.target.value)} />
        <Input label="确认密码" type="password" placeholder="再次输入密码" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />

        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center' }}>{error}</div>}

        <Button type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', marginTop: 4 }} disabled={loading}>
          {loading ? '注册中...' : '注 册'}
        </Button>
      </div>
    </form>
  )
}
