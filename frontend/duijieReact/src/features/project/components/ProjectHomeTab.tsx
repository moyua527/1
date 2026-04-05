import { useState, useEffect, useCallback } from 'react'
import { Users, ListTodo, CheckCircle2, Clock } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import Avatar from '../../ui/Avatar'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface Props {
  project: any
  projectId: string
  tasks: any[]
  milestones: any[]
  onTabSwitch: (tab: string) => void
  isMobile?: boolean
}

export default function ProjectHomeTab({ project, projectId, tasks, milestones, onTabSwitch, isMobile }: Props) {
  const [activities, setActivities] = useState<any[]>([])

  const loadActivity = useCallback(() => {
    fetchApi(`/api/projects/${projectId}/activity?limit=8`).then(r => {
      if (r.success) setActivities(r.data || [])
    })
  }, [projectId])

  useEffect(() => { loadActivity() }, [loadActivity])

  const members = project.members || []
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'approved').length
  const completedMs = milestones.filter(m => m.is_completed).length

  const stats = [
    { icon: Users, label: '成员', value: members.length, color: '#8b5cf6', bg: '#f5f3ff' },
    { icon: ListTodo, label: '需求', value: `${completedTasks}/${totalTasks}`, color: '#3b82f6', bg: '#eff6ff' },
    { icon: CheckCircle2, label: '代办', value: `${completedMs}/${milestones.length}`, color: '#22c55e', bg: '#f0fdf4' },
  ]

  const activityIcon: Record<string, string> = {
    task_created: '📋',
    milestone_created: '🏁',
    milestone_completed: '✅',
    member_joined: '👤',
  }

  const activityLabel: Record<string, string> = {
    task_created: '创建了需求',
    milestone_created: '创建了代办阶段',
    milestone_completed: '完成了代办阶段',
    member_joined: '加入了项目',
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...section, marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '14px 8px' : '16px 12px', gap: 6, cursor: 'pointer' }}
            onClick={() => onTabSwitch(s.label === '成员' ? 'settings' : s.label === '需求' ? 'tasks' : 'milestones')}>
            <s.icon size={isMobile ? 20 : 24} style={{ color: s.color }} />
            <span style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {project.description && (
        <div style={section}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{project.description}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>项目成员</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({members.length})</span>
          </div>
          {members.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 12, textAlign: 'center' }}>暂无成员</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {members.slice(0, 12).map((m: any) => (
                <div key={m.user_id || m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                  <Avatar name={m.nickname || m.username || '?'} src={m.avatar} size={22} />
                  <span style={{ fontSize: 12, color: 'var(--text-heading)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nickname || m.username}</span>
                </div>
              ))}
              {members.length > 12 && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 8px', alignSelf: 'center' }}>+{members.length - 12}</span>}
            </div>
          )}
        </div>

        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>最近动态</span>
          </div>
          {activities.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 12, textAlign: 'center' }}>暂无动态</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
              {activities.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ flexShrink: 0 }}>{activityIcon[a.type] || '📌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{a.actor_name || a.actor_username || '系统'}</span>
                    <span style={{ color: 'var(--text-secondary)' }}> {activityLabel[a.type] || a.type} </span>
                    <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{a.title}</span>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 2 }}>{new Date(a.happened_at).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
