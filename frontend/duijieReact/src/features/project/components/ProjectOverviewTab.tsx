import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, ListTodo, Users, FileText, MessageSquare, Target, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { projectApi } from '../services/api'
import Avatar from '../../ui/Avatar'
import s from './ProjectOverviewTab.module.css'

const STATUS_LABELS: Record<string, string> = {
  todo: '待办', submitted: '已提出', disputed: '待补充',
  in_progress: '执行中', pending_review: '待验收',
  review_failed: '验收不通过', completed: '已完成',
}
const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8', submitted: '#6366f1', disputed: '#f59e0b',
  in_progress: '#3b82f6', pending_review: '#8b5cf6',
  review_failed: '#ef4444', completed: '#10b981',
}
const ACTIVITY_LABELS: Record<string, string> = {
  task_created: '创建了需求', member_joined: '加入了项目',
}

interface OverviewData {
  tasks: { total: number; completed: number; todo: number; submitted: number; in_progress: number; pending_review: number; review_failed: number; disputed: number; overdue: number; completion_rate: number }
  members: number
  files: number
  messages: number
  milestones: { total: number; done: number }
  activity: { type: string; title: string; happened_at: string; actor_name: string; actor_avatar: string }[]
}

export default function ProjectOverviewTab({ project, projectId }: { project: any; projectId: string }) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    projectApi.getOverview(projectId).then(r => {
      if (r.success) setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  if (loading) return <div className={s.centered}>加载中...</div>
  if (!data) return <div className={s.centered}>暂无数据</div>

  const pieData = [
    { name: STATUS_LABELS.completed, value: data.tasks.completed, color: STATUS_COLORS.completed },
    { name: STATUS_LABELS.in_progress, value: data.tasks.in_progress, color: STATUS_COLORS.in_progress },
    { name: STATUS_LABELS.pending_review, value: data.tasks.pending_review, color: STATUS_COLORS.pending_review },
    { name: STATUS_LABELS.submitted, value: data.tasks.submitted, color: STATUS_COLORS.submitted },
    { name: STATUS_LABELS.todo, value: data.tasks.todo, color: STATUS_COLORS.todo },
    { name: STATUS_LABELS.disputed, value: data.tasks.disputed, color: STATUS_COLORS.disputed },
    { name: STATUS_LABELS.review_failed, value: data.tasks.review_failed, color: STATUS_COLORS.review_failed },
  ].filter(d => d.value > 0)

  const msRate = data.milestones.total > 0 ? Math.round(data.milestones.done / data.milestones.total * 100) : 0

  return (
    <div className={s.wrap}>
      {/* Project Info */}
      <div className={s.projectInfo}>
        <div className={s.projectMeta}>
          <div className={s.projectName}>{project.name}</div>
          {project.display_id && <span className={s.projectId}>{project.display_id}</span>}
          {project.description && <div className={s.projectDesc}>{project.description}</div>}
        </div>
        <div className={s.projectDates}>
          {project.start_date && (
            <div className={s.dateRange}>
              <Clock size={14} />
              {project.start_date?.slice(0, 10)} ~ {project.end_date?.slice(0, 10) || '未定'}
            </div>
          )}
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className={s.statsGrid}>
        <StatCard icon={ListTodo} color="#3b82f6" label="总需求" value={data.tasks.total} />
        <StatCard icon={CheckCircle2} color="#10b981" label="已完成" value={data.tasks.completed} />
        <StatCard icon={AlertTriangle} color="#ef4444" label="已逾期" value={data.tasks.overdue} />
        <StatCard icon={Users} color="#8b5cf6" label="项目成员" value={data.members} />
        <StatCard icon={FileText} color="#f59e0b" label="文件" value={data.files} />
        <StatCard icon={MessageSquare} color="#06b6d4" label="消息" value={data.messages} />
      </div>

      {/* Charts + Activity — stacks vertically on mobile via CSS */}
      <div className={s.chartsSection}>
        {data.tasks.total > 0 && (
          <div className={s.card}>
            <div className={s.sectionTitle}>需求状态分布</div>
            <div className={s.pieLayout}>
              <div className={s.pieContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" paddingAngle={2} animationDuration={600}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={s.pieCenter}>
                  <div className={s.pieRate}>{data.tasks.completion_rate}%</div>
                  <div className={s.pieLabel}>完成率</div>
                </div>
              </div>
              <div className={s.legendList}>
                {pieData.map(d => (
                  <div key={d.name} className={s.legendItem}>
                    <span className={s.legendDot} style={{ background: d.color }} />
                    <span className={s.legendName}>{d.name}</span>
                    <span className={s.legendValue}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {data.milestones.total > 0 && (
          <div className={s.card}>
            <div className={s.milestoneHeader}>
              <Target size={16} color="#8b5cf6" />
              <span className={s.milestoneTitle}>代办进度</span>
              <span className={s.milestoneCount}>{data.milestones.done}/{data.milestones.total}</span>
            </div>
            <div className={s.milestoneTrack}>
              <div className={s.milestoneFill} style={{ width: `${msRate}%` }} />
            </div>
            <div className={s.milestonePercent}>{msRate}% 完成</div>
          </div>
        )}

        {data.activity.length > 0 && (
          <div className={s.card}>
            <div className={s.sectionTitle}>最近动态</div>
            {data.activity.slice(0, 8).map((a, i) => (
              <div key={i} className={s.activityItem}>
                <Avatar name={a.actor_name || '?'} src={a.actor_avatar} size={28} />
                <div className={s.activityBody}>
                  <div className={s.activityText}>
                    <span className={s.activityActor}>{a.actor_name}</span>
                    <span className={s.activityAction}> {ACTIVITY_LABELS[a.type] || a.type} </span>
                    <span className={s.activityTarget}>{a.title}</span>
                  </div>
                  <div className={s.activityTime}>{formatTime(a.happened_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: number }) {
  return (
    <div className={s.statCard}>
      <div className={s.statIcon} style={{ background: `${color}15` }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className={s.statValue}>{value}</div>
        <div className={s.statLabel}>{label}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    planning: { bg: '#dbeafe', color: '#2563eb', label: '规划中' },
    active: { bg: '#dcfce7', color: '#16a34a', label: '进行中' },
    completed: { bg: '#f3e8ff', color: '#7c3aed', label: '已完成' },
    archived: { bg: '#f1f5f9', color: '#64748b', label: '已归档' },
  }
  const v = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status }
  return <span className={s.statusBadge} style={{ background: v.bg, color: v.color }}>{v.label}</span>
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className={s.tooltip}>
      <div className={s.tooltipInner}>
        <span className={s.legendDot} style={{ background: d.payload?.fill }} />
        <span className={s.tooltipValue}>{d.name}: {d.value}</span>
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
