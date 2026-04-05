import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronDown, X, Rocket } from 'lucide-react'
import useUserStore from '../../stores/useUserStore'
import { fetchApi } from '../../bootstrap'

interface CheckItem {
  id: string
  label: string
  desc: string
  route?: string
}

const CHECKLIST: CheckItem[] = [
  { id: 'create_project', label: '创建第一个项目', desc: '前往项目管理，创建一个新项目', route: '/projects' },
  { id: 'invite_member', label: '邀请一位成员', desc: '在项目概览中点击 + 邀请团队成员' },
  { id: 'create_task', label: '创建一个需求', desc: '在项目的需求标签页中创建需求' },
  { id: 'set_milestone', label: '设置代办', desc: '使用代办功能规划项目阶段' },
  { id: 'send_message', label: '发送一条消息', desc: '在消息模块与团队成员沟通', route: '/messaging' },
]

const STORAGE_KEY = (uid: number) => `onboarding_checklist_${uid}`
const DISMISSED_KEY = (uid: number) => `onboarding_dismissed_${uid}`

export default function OnboardingChecklist() {
  const user = useUserStore(s => s.user)
  const navigate = useNavigate()
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user) return
    const d = localStorage.getItem(DISMISSED_KEY(user.id))
    if (d) { setDismissed(true); return }
    const raw = localStorage.getItem(STORAGE_KEY(user.id))
    if (raw) {
      try { setCompleted(new Set(JSON.parse(raw))) } catch { /* skip */ }
    }
    setVisible(true)
  }, [user])

  const checkProgress = useCallback(async () => {
    if (!user) return
    const done = new Set(completed)
    try {
      const [projRes, dmRes] = await Promise.all([
        fetchApi('/api/projects'),
        fetchApi('/api/dm/conversations'),
      ])
      if (projRes.success && projRes.data?.length > 0) {
        const myProject = projRes.data.find((p: any) => p.created_by === user.id)
        if (myProject) done.add('create_project')
        const withMembers = projRes.data.find((p: any) => p.member_count > 1)
        if (withMembers) done.add('invite_member')
      }
      if (dmRes.success && dmRes.data?.length > 0) done.add('send_message')
    } catch { /* skip */ }

    if (done.size !== completed.size) {
      setCompleted(done)
      localStorage.setItem(STORAGE_KEY(user.id), JSON.stringify([...done]))
    }
  }, [user, completed])

  useEffect(() => {
    if (!visible || dismissed || !user) return
    checkProgress()
    const t = setInterval(checkProgress, 60000)
    return () => clearInterval(t)
  }, [visible, dismissed, user, checkProgress])

  useEffect(() => {
    if (!user) return
    const handler = (e: CustomEvent) => {
      const { type } = e.detail || {}
      if (!type) return
      setCompleted(prev => {
        const next = new Set(prev)
        next.add(type)
        localStorage.setItem(STORAGE_KEY(user.id), JSON.stringify([...next]))
        return next
      })
    }
    window.addEventListener('onboarding-done' as any, handler)
    return () => window.removeEventListener('onboarding-done' as any, handler)
  }, [user])

  const handleDismiss = () => {
    if (!user) return
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY(user.id), '1')
  }

  if (!visible || dismissed || !user) return null

  const doneCount = CHECKLIST.filter(c => completed.has(c.id)).length
  const allDone = doneCount === CHECKLIST.length
  const pct = Math.round((doneCount / CHECKLIST.length) * 100)

  if (allDone) {
    setTimeout(handleDismiss, 3000)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 800,
      width: collapsed ? 'auto' : 300,
      background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
      borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      overflow: 'hidden', transition: 'width 0.2s ease',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
          cursor: 'pointer', background: allDone ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, var(--brand), #8b5cf6)',
          color: '#fff',
        }}
      >
        <Rocket size={16} />
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {allDone ? '🎉 全部完成！' : '新手清单'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>
              {allDone ? '你已经掌握了基本操作' : `${doneCount}/${CHECKLIST.length} 已完成`}
            </div>
          </div>
        )}
        {collapsed
          ? <span style={{ fontSize: 11, fontWeight: 600 }}>{doneCount}/{CHECKLIST.length}</span>
          : <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={e => { e.stopPropagation(); handleDismiss() }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 2, display: 'flex' }}
                title="关闭">
                <X size={14} />
              </button>
              <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </div>
        }
      </div>

      {/* Progress bar */}
      {!collapsed && (
        <div style={{ padding: '0 14px', paddingTop: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border-primary)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: allDone ? '#10b981' : 'var(--brand)',
              width: `${pct}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Checklist */}
      {!collapsed && (
        <div style={{ padding: '8px 10px 12px' }}>
          {CHECKLIST.map(item => {
            const done = completed.has(item.id)
            return (
              <div key={item.id}
                onClick={() => !done && item.route && navigate(item.route)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 6px',
                  borderRadius: 8, cursor: !done && item.route ? 'pointer' : 'default',
                  transition: 'background 0.12s',
                  opacity: done ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!done && item.route) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {done
                  ? <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                  : <Circle size={18} style={{ color: 'var(--border-primary)', flexShrink: 0, marginTop: 1 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: done ? 'var(--text-tertiary)' : 'var(--text-heading)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{item.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
