import { useState, useEffect } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'

const CONFIG_GROUPS = [
  { title: '基础设置', icon: '⚙️', items: [
    { key: 'SITE_NAME', label: '系统名称', desc: '显示在登录页和侧边栏的系统名称', placeholder: '对接平台' },
    { key: 'WELCOME_MSG', label: '欢迎消息', desc: '登录后仪表盘显示的欢迎消息', placeholder: '欢迎使用对接平台' },
    { key: 'MAX_UPLOAD_MB', label: '最大上传大小 (MB)', desc: '单个文件上传的最大体积限制', placeholder: '10' },
    { key: 'DEFAULT_LANGUAGE', label: '默认语言', desc: '系统默认显示语言', placeholder: 'zh-CN' },
  ]},
  { title: '业务设置', icon: '📊', items: [
    { key: 'TASK_DEFAULT_PRIORITY', label: '任务默认优先级', desc: '新建任务时的默认优先级 (low/medium/high/urgent)', placeholder: 'medium' },
    { key: 'FOLLOW_UP_REMINDER_DAYS', label: '跟进提醒天数', desc: '跟进即将到期的提前提醒天数', placeholder: '3' },
    { key: 'CONTRACT_ALERT_DAYS', label: '合同到期提醒天数', desc: '合同到期前多少天开始提醒', placeholder: '30' },
    { key: 'DEFAULT_CLIENT_STAGE', label: '默认客户阶段', desc: '新建客户时的默认阶段 (potential/intent/signed)', placeholder: 'potential' },
    { key: 'OPPORTUNITY_STAGES', label: '商机阶段', desc: '商机管道的阶段名称，逗号分隔', placeholder: '线索,验证,方案,谈判,赢单,丢单' },
  ]},
  { title: '安全设置', icon: '🔒', items: [
    { key: 'INVITE_CODE', label: '注册邀请码', desc: '注册时需要输入的邀请码，留空则不需要邀请码', placeholder: '留空则关闭' },
    { key: 'LOGIN_MAX_ATTEMPTS', label: '登录最大尝试次数', desc: '15分钟内允许的最大登录失败次数', placeholder: '10' },
    { key: 'SESSION_TIMEOUT_HOURS', label: '会话超时 (小时)', desc: 'JWT Token 有效期', placeholder: '24' },
    { key: 'PASSWORD_MIN_LENGTH', label: '密码最小长度', desc: '注册和修改密码时的最小长度要求', placeholder: '6' },
  ]},
]

export default function SystemSettings() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchApi('/api/system/config').then(r => {
      if (r.success) setConfig(r.data || {})
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const r = await fetchApi('/api/system/config', { method: 'PUT', body: JSON.stringify(config) })
    setSaving(false)
    if (r.success) toast('配置已保存', 'success')
    else toast(r.message || '保存失败', 'error')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>系统配置</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>管理平台全局设置</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {saving ? ' 保存中...' : ' 保存配置'}
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {CONFIG_GROUPS.map(group => (
          <div key={group.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>{group.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{group.title}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>({group.items.length} 项)</span>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {group.items.map((item, idx) => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px', borderBottom: idx < group.items.length - 1 ? '1px solid #f1f5f9' : 'none', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 280px', minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.desc}</div>
                  </div>
                  <div style={{ flex: '1 1 280px', minWidth: 180 }}>
                    <input
                      value={config[item.key] || ''}
                      onChange={e => setConfig({ ...config, [item.key]: e.target.value })}
                      placeholder={item.placeholder}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
