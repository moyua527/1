import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, TrendingUp, CheckCircle2, Clock, Loader2, Users } from 'lucide-react'
import { projectApi } from '../services/api'
import Button from '../../ui/Button'
import useIsMobile from '../../ui/useIsMobile'
import useNicknameStore from '../../../stores/useNicknameStore'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: '#3b82f6' },
  in_progress: { label: '进行中', color: '#f59e0b' },
  active: { label: '进行中', color: '#f59e0b' },
  done: { label: '已完成', color: '#22c55e' },
  completed: { label: '已完成', color: '#22c55e' },
  archived: { label: '已归档', color: '#6b7280' },
}

export default function ProjectManagementHome() {
  const nav = useNavigate()
  const isMobile = useIsMobile()
  const { getDisplayName } = useNicknameStore()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectApi.list().then(r => {
      if (r.success) setProjects(r.data || [])
      setLoading(false)
    })
  }, [])

  const totalMembers = projects.reduce((s, p) => s + (p.member_count || 0), 0)
  const statusGroups = projects.reduce((acc, p) => {
    const key = p.status || 'planning'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const stats = [
    { label: '全部项目', value: projects.length, icon: FolderKanban, color: '#3b82f6' },
    { label: '进行中', value: (statusGroups['in_progress'] || 0) + (statusGroups['active'] || 0), icon: TrendingUp, color: '#f59e0b' },
    { label: '已完成', value: (statusGroups['done'] || 0) + (statusGroups['completed'] || 0), icon: CheckCircle2, color: '#22c55e' },
    { label: '总成员', value: totalMembers, icon: Users, color: '#8b5cf6' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: 'var(--text-tertiary)' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>项目总览</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>所有项目的汇总信息</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => nav('/projects')}>
            <FolderKanban size={14} /> 项目列表
          </Button>
          <Button onClick={() => nav('/projects', { state: { create: true } })}>
            <Plus size={14} /> 新建项目
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 14 : 18,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} color={s.color} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>最近项目</h3>
          <button onClick={() => nav('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--brand)' }}>
            查看全部 →
          </button>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
            <FolderKanban size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div style={{ fontSize: 14 }}>暂无项目</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>点击「新建项目」开始</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {projects.slice(0, 8).map(p => {
              const st = statusMap[p.status] || statusMap.planning
              const displayName = getDisplayName(p.id, p.name)
              return (
                <div key={p.id} onClick={() => nav(`/projects/${p.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 10, cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: 16, fontWeight: 700, color: 'var(--brand)',
                  }}>
                    {(displayName || '?')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </div>
                    {p.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.description}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${st.color}15`, color: st.color, fontWeight: 500, flexShrink: 0 }}>
                    {st.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    <Users size={12} /> {p.member_count || 0}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    <Clock size={12} /> {p.task_count || 0}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
