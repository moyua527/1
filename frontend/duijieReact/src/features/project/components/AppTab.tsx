import { AppWindow, ExternalLink } from 'lucide-react'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface Props {
  project: any
}

export default function AppTab({ project }: Props) {
  const validUrl = project.app_url && /^https?:\/\/.+/.test(project.app_url)

  if (validUrl) {
    return (
      <div style={section}>
        <div style={{ borderRadius: 12, border: '1px solid #dbeafe', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppWindow size={36} color="#fff" />
          </div>
          <h4 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>{project.app_name || '应用'}</h4>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 360 }}>
            点击下方按钮在新窗口中打开应用
          </p>
          <a href={project.app_url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'var(--bg-primary)', borderRadius: 12, fontSize: 15, textDecoration: 'none', fontWeight: 600, marginTop: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)' }}>
            <ExternalLink size={16} /> 打开应用
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={section}>
      <div style={{ borderRadius: 12, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 12 }}>
        <AppWindow size={40} color="var(--text-tertiary)" />
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {project.app_url ? '应用链接无效' : '该项目未配置应用'}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
          {project.app_url ? '链接必须以 http:// 或 https:// 开头，请编辑修正' : '请在项目设置中添加应用链接'}
        </p>
      </div>
    </div>
  )
}
