import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { APP_VERSION } from '../../utils/capacitor'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'

const VERSION_LOG: { ver: string; date: string; desc: string }[] = [
  { ver: '1.3.5', date: '2026-04-08', desc: '基础设施升级：Redis缓存、SSE推送、移动端账号与安全重构、通知带项目名、版本信息页' },
  { ver: '1.3.4', date: '2026-04-08', desc: 'APP更新修复：Service Worker缓存刷新、WebView缓存清理' },
  { ver: '1.3.3', date: '2026-04-08', desc: '移动端适配：项目图标自适应、需求看板响应式、客户详情单列化' },
  { ver: '1.3.2', date: '2026-04-07', desc: '任务权限补齐：细粒度权限校验覆盖任务编辑、状态流转、附件、审核要点' },
  { ver: '1.3.1', date: '2026-04-07', desc: '移动端横向滚动导航栏，触摸左右滑动切换页面' },
  { ver: '1.3.0', date: '2026-04-07', desc: '修复角色权限更新不生效、数据迁移修正历史成员角色' },
  { ver: '1.2.9', date: '2026-04-07', desc: '标签滑动重排、Chrome风格平滑滚动、需求标题记忆' },
  { ver: '1.2.8', date: '2026-04-07', desc: '项目卡片统一尺寸、标签页凸出/凹陷视觉优化' },
  { ver: '1.2.7', date: '2026-04-06', desc: '通知中心：角标、实时推送、全部已读、一键清除' },
  { ver: '1.2.6', date: '2026-04-06', desc: '日历视图、文件管理面板、项目图标选择器' },
  { ver: '1.2.5', date: '2026-04-06', desc: '里程碑进度追踪、参与人管理、提醒功能' },
  { ver: '1.2.0', date: '2026-04-05', desc: '项目角色权限系统：60+细粒度权限、角色管理面板' },
  { ver: '1.1.0', date: '2026-04-04', desc: '企业多租户、项目邀请链接、客户关联请求' },
  { ver: '1.0.0', date: '2026-04-01', desc: '初始版本：项目管理、需求看板、消息、仪表盘' },
]

export default function AboutPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [showLog, setShowLog] = useState(false)

  const checkUpdate = async () => {
    setChecking(true)
    try {
      const r = await fetchApi('/api/version')
      if (r.success && r.data) {
        if (r.data.version !== APP_VERSION) {
          toast(`发现新版本 v${r.data.version}`, 'success')
        } else {
          toast('已是最新版本', 'success')
        }
      } else {
        toast('已是最新版本', 'success')
      }
    } catch {
      toast('检查更新失败', 'error')
    }
    setChecking(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ marginTop: 32, marginBottom: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>D</span>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>DuiJie</div>
        <div style={{ fontSize: 15, color: 'var(--text-tertiary)', marginBottom: 32 }}>Version {APP_VERSION}</div>

        <div style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div onClick={() => setShowLog(!showLog)} style={{
            display: 'flex', alignItems: 'center', padding: '16px 18px', cursor: 'pointer',
            borderBottom: '1px solid var(--border-secondary)',
          }}>
            <span style={{ flex: 1, fontSize: 16, color: 'var(--text-primary)' }}>功能介绍</span>
            {showLog
              ? <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />
              : <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />}
          </div>
          <div onClick={checkUpdate} style={{
            display: 'flex', alignItems: 'center', padding: '16px 18px', cursor: 'pointer',
          }}>
            <span style={{ flex: 1, fontSize: 16, color: 'var(--text-primary)' }}>版本更新</span>
            {checking
              ? <Loader2 size={16} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
              : <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />}
          </div>
        </div>

        {showLog && (
          <div style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: 16, padding: '4px 0', marginBottom: 16, maxHeight: '50vh', overflowY: 'auto' }}>
            {VERSION_LOG.map((item, i) => (
              <div key={item.ver} style={{
                padding: '14px 18px',
                borderBottom: i < VERSION_LOG.length - 1 ? '1px solid var(--border-secondary)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: item.ver === APP_VERSION ? 'var(--brand)' : 'var(--text-heading)' }}>
                    v{item.ver} {item.ver === APP_VERSION && '(当前)'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{item.date}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 4 }}>DuiJie · 轻量级项目协作平台</div>
          <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>Copyright &copy; 2024-{new Date().getFullYear()} DuiJie. All Rights Reserved.</div>
        </div>
      </div>
    </div>
  )
}
