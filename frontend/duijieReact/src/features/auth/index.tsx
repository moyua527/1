import { useState, useEffect, useMemo } from 'react'
import { authApi } from './services/api'
import { setToken } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Lock, User, Mail, Phone, KeyRound } from 'lucide-react'
import { areaData } from '../../data/areaCode'

interface Props { onLogin: (user: any) => void }

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

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [gender, setGender] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [needInvite, setNeedInvite] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { authApi.registerConfig().then(r => { if (r.success) setNeedInvite(r.data?.needInviteCode || false) }) }, [])

  const resetForm = () => { setUsername(''); setPassword(''); setConfirmPwd(''); setNickname(''); setEmail(''); setPhone(''); setInviteCode(''); setGender(''); setProvince(''); setCity(''); setDistrict(''); setError(''); setSuccess('') }

  const cities = useMemo(() => province && areaData[province]?.children ? areaData[province].children : {}, [province])
  const districts = useMemo(() => province && city && cities[city]?.children ? cities[city].children : {}, [province, city, cities])
  const areaCode = province && city && district ? province + city + district : ''
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
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setError('用户名仅支持字母、数字和下划线'); return }
    if (!password || password.length < 6) { setError('密码至少6个字符'); return }
    if (password !== confirmPwd) { setError('两次密码不一致'); return }
    if (!email.trim() && !phone.trim()) { setError('邮箱和手机号至少填写一项'); return }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('邮箱格式无效'); return }
    if (!gender) { setError('请选择性别'); return }
    if (!areaCode || areaCode.length !== 6) { setError('请选择完整的省/市/区'); return }
    if (!inviteCode.trim()) { setError('请输入邀请码'); return }
    setLoading(true)
    try {
      const res = await authApi.register({
        username: username.trim(), password, nickname: nickname.trim() || undefined,
        email: email.trim() || undefined, phone: phone.trim() || undefined,
        gender: Number(gender), area_code: areaCode,
        invite_code: inviteCode.trim() || undefined,
      })
      if (res.success) { setSuccess('注册成功！即将跳转登录...'); setTimeout(() => switchMode('login'), 1500) }
      else setError(res.message || '注册失败')
    } catch { setError('网络错误') }
    setLoading(false)
  }

  const pwdStrength = getPwdStrength(password)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f1f5f9 50%, #faf5ff 100%)', padding: 16, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: 420, maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1e40af', letterSpacing: -0.5 }}>DuiJie</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>项目对接平台</div>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 20 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#0f172a' : '#64748b',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="用户名" placeholder={mode === 'register' ? '字母、数字、下划线，至少3位' : '输入用户名'} value={username} onChange={e => setUsername(e.target.value)} />

          {mode === 'register' && (
            <>
              <Input label="昵称（选填）" placeholder="不填则使用用户名" value={nickname} onChange={e => setNickname(e.target.value)} />
              <div style={{ fontSize: 12, color: '#64748b', margin: '-4px 0 2px' }}>邮箱和手机号至少填写一项</div>
              <Input label="邮箱" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <Input label="手机号" placeholder="输入手机号" value={phone} onChange={e => setPhone(e.target.value)} />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>性别 *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ v: '1', l: '男' }, { v: '2', l: '女' }].map(g => (
                    <button key={g.v} type="button" onClick={() => setGender(g.v)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${gender === g.v ? '#2563eb' : '#cbd5e1'}`, background: gender === g.v ? '#eff6ff' : '#fff', color: gender === g.v ? '#2563eb' : '#64748b', fontWeight: 500, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>所在地区 *</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select value={province} onChange={e => { setProvince(e.target.value); setCity(''); setDistrict('') }} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="">省份</option>
                    {Object.entries(areaData).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                  <select value={city} onChange={e => { setCity(e.target.value); setDistrict('') }} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }} disabled={!province}>
                    <option value="">城市</option>
                    {Object.entries(cities).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                  <select value={district} onChange={e => setDistrict(e.target.value)} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }} disabled={!city}>
                    <option value="">区县</option>
                    {Object.entries(districts).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <Input label="密码" type="password" placeholder={mode === 'register' ? '至少6个字符' : '输入密码'} value={password} onChange={e => setPassword(e.target.value)} />

          {mode === 'register' && password && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwdStrength.level ? pwdStrength.color : '#e2e8f0', transition: 'background 0.2s' }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: pwdStrength.color, fontWeight: 500 }}>{pwdStrength.label}</span>
            </div>
          )}

          {mode === 'register' && (
            <Input label="确认密码" type="password" placeholder="再次输入密码" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
          )}

          {mode === 'register' && (
            <Input label="邀请码 *" placeholder="输入系统邀请码或他人专属邀请码" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} />
          )}

          {error && <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{error}</div>}
          {success && <div style={{ color: '#16a34a', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>{success}</div>}

          <Button style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }} disabled={loading}>
            {loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登 录' : '注 册')}
          </Button>
        </div>

        {mode === 'register' && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            注册后默认为成员角色，管理员可调整权限
          </div>
        )}
      </form>
    </div>
  )
}
