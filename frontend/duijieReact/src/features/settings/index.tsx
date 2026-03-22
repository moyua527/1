import { useState, useEffect } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'

const CONFIG_ITEMS = [
  { key: 'SITE_NAME', label: '系统名称', desc: '显示在登录页和侧边栏的系统名称', placeholder: '对接平台' },
  { key: 'INVITE_CODE', label: '邀请码', desc: '注册时需要输入的邀请码，留空则不需要邀请码', placeholder: '留空则关闭' },
  { key: 'WELCOME_MSG', label: '欢迎消息', desc: '登录后仪表盘显示的欢迎消息', placeholder: '欢迎使用对接平台' },
  { key: 'MAX_UPLOAD_MB', label: '最大上传大小 (MB)', desc: '单个文件上传的最大体积限制', placeholder: '10' },
  { key: 'TASK_DEFAULT_PRIORITY', label: '任务默认优先级', desc: '新建任务时的默认优先级 (low/medium/high)', placeholder: 'medium' },
  { key: 'FOLLOW_UP_REMINDER_DAYS', label: '跟进提醒天数', desc: '跟进即将到期的提前提醒天数', placeholder: '3' },
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CONFIG_ITEMS.map(item => (
          <div key={item.key} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.desc}</div>
              </div>
              <div style={{ flex: '1 1 300px', minWidth: 200 }}>
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
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>自定义配置</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>以上为预定义配置项。系统配置以键值对形式存储，所有配置可在此统一管理。</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存所有配置'}
          </Button>
        </div>
      </div>
    </div>
  )
}
