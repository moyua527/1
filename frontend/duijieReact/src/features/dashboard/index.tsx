import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FolderKanban, Users, ListTodo, CheckCircle, TrendingUp, Clock, Loader2, FileSignature, AlertTriangle, Bell, MessageSquare } from 'lucide-react'
import { can } from '../../stores/permissions'
import { useDashboardStats, useDashboardChart } from '../../hooks/useApi'
import DashboardCharts from './DashboardCharts'
import ClientDashboard from './ClientDashboard'
import WorkspaceSection from './WorkspaceSection'

interface Stats {
  totalProjects: number; activeProjects: number; completedProjects: number
  totalClients: number; totalTasks: number; pendingTasks: number; completedTasks: number
  clientStages?: { potential: number; intent: number; signed: number; active: number; lost: number }
  contracts?: { total: number; totalAmount: number; activeCount: number; activeAmount: number }
  followUpAlerts?: { overdue: number; upcoming: number }
  recentFollowUps?: any[]
  recentContracts?: any[]
  projects?: any[]
  milestones?: any[]
  files?: any[]
}

const stageConfig = [
  { key: 'potential', label: '潜在客户', color: '#6b7280', bg: '#f3f4f6' },
  { key: 'intent', label: '意向客户', color: 'var(--brand)', bg: 'var(--brand-light-2)' },
  { key: 'signed', label: '签约客户', color: 'var(--color-purple)', bg: '#ede9fe' },
  { key: 'active', label: '合作中', color: 'var(--color-success)', bg: '#dcfce7' },
  { key: 'lost', label: '流失', color: 'var(--color-danger)', bg: '#fee2e2' },
]

const card: React.CSSProperties = {
  background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow 0.15s',
}
const iconBox = (bg: string): React.CSSProperties => ({
  width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
})

export default function Dashboard() {
  const [chartDays, setChartDays] = useState(30)
  const nav = useNavigate()
  const { user, isMobile } = useOutletContext<{ user: any; isMobile?: boolean }>()
  const r = user?.role || ''
  const canClients = can(r, 'dashboard:clients')
  const canTasks = can(r, 'dashboard:tasks')


  const isClient = r === 'client'

  const { data: stats } = useDashboardStats() as { data: Stats | undefined }
  const { data: chartData } = useDashboardChart(chartDays) as { data: any }

  if (isClient && stats) return <ClientDashboard stats={stats} nav={nav} />
  if (isClient && !stats) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>

  const items = stats ? [
    { label: '总项目', value: stats.totalProjects, icon: FolderKanban, bg: 'var(--brand-light-2)', color: 'var(--brand)', path: '/projects' },
    { label: '进行中', value: stats.activeProjects, icon: TrendingUp, bg: '#fef3c7', color: 'var(--color-warning)', path: '/projects' },
    { label: '已完成', value: stats.completedProjects, icon: CheckCircle, bg: '#dcfce7', color: 'var(--color-success)', path: '/projects' },
    ...(canClients ? [
      { label: '客户总数', value: stats.totalClients, icon: Users, bg: '#f3e8ff', color: 'var(--color-purple)', path: '/clients' },
    ] : []),
    ...(canTasks ? [
      { label: '总需求', value: stats.totalTasks, icon: ListTodo, bg: '#e0f2fe', color: '#0284c7', path: '/tasks' },
      { label: '待办需求', value: stats.pendingTasks, icon: Clock, bg: '#fee2e2', color: 'var(--color-danger)', path: '/tasks' },
    ] : []),
  ] : []

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>仪表盘</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>项目对接平台概览</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {items.map(item => (
          <div key={item.label} style={card} onClick={() => nav(item.path)}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
            <div style={iconBox(item.bg)}><item.icon size={22} color={item.color} /></div>
            <div>
              <div style={{ fontSize: typeof item.value === 'string' ? 20 : 28, fontWeight: 700, color: 'var(--text-heading)' }}>{item.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>
      <WorkspaceSection isMobile={!!isMobile} />
      {chartData && <DashboardCharts chartData={chartData} days={chartDays} onDaysChange={setChartDays} canClients={canClients} isMobile={!!isMobile} />}
      {canClients && stats?.clientStages && (() => {
        const stages = stats.clientStages!
        const total = Object.values(stages).reduce((a, b) => a + b, 0)
        const maxCount = Math.max(...Object.values(stages), 1)
        return (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: isMobile ? 16 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: 24, border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 8, marginBottom: 20 }}>
              <Users size={20} color="var(--brand)" />
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>销售漏斗</span>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>客户阶段分布 · 共 {total} 位客户</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {stageConfig.map((s, i) => {
                const count = (stages as any)[s.key] || 0
                const widthPct = total > 0 ? Math.max(20, ((maxCount - (i * maxCount / 5)) / maxCount) * 100) : 20
                const barWidth = total > 0 ? Math.max(8, (count / maxCount) * 100) : 8
                return (
                  <div key={s.key} style={{ width: isMobile ? '100%' : `${widthPct}%`, minWidth: isMobile ? 0 : 180, cursor: 'pointer' }} onClick={() => nav(`/clients?stage=${s.key}`)}>
                    <div style={{ background: s.bg, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barWidth}%`, background: s.color, opacity: 0.12, borderRadius: 8 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-body)' }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 20, fontWeight: 700, color: s.color, zIndex: 1 }}>{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
      {canClients && stats?.followUpAlerts && (stats.followUpAlerts.overdue > 0 || stats.followUpAlerts.upcoming > 0) && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
            <Bell size={20} color="var(--color-warning)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>跟进提醒</span>
          </div>
          {stats.followUpAlerts.overdue > 0 && (
            <div onClick={() => nav('/clients')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#fef2f2', cursor: 'pointer', border: '1px solid #fecaca', width: isMobile ? '100%' : undefined }}>
              <AlertTriangle size={16} color="var(--color-danger)" />
              <span style={{ fontSize: 14, color: 'var(--color-danger)', fontWeight: 600 }}>{stats.followUpAlerts.overdue} 位客户</span>
              <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>跟进已过期</span>
            </div>
          )}
          {stats.followUpAlerts.upcoming > 0 && (
            <div onClick={() => nav('/clients')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#fffbeb', cursor: 'pointer', border: '1px solid #fde68a', width: isMobile ? '100%' : undefined }}>
              <Clock size={16} color="var(--color-warning)" />
              <span style={{ fontSize: 14, color: 'var(--color-warning)', fontWeight: 600 }}>{stats.followUpAlerts.upcoming} 位客户</span>
              <span style={{ fontSize: 13, color: 'var(--color-warning)' }}>3天内需跟进</span>
            </div>
          )}
        </div>
      )}
      {canClients && stats && ((stats.recentFollowUps?.length || 0) > 0 || (stats.recentContracts?.length || 0) > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 24 }}>
          {(stats.recentFollowUps?.length || 0) > 0 && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <MessageSquare size={18} color="var(--brand)" />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>最近跟进</span>
              </div>
              {stats.recentFollowUps!.map((f: any) => (
                <div key={f.id} onClick={() => nav(`/clients/${f.client_id}`)} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{f.client_name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(f.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap', wordBreak: 'break-word' }}>{f.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(stats.recentContracts?.length || 0) > 0 && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <FileSignature size={18} color="var(--color-success)" />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>最近合同</span>
              </div>
              {stats.recentContracts!.map((c: any) => {
                const stMap: Record<string, { label: string; color: string }> = { draft: { label: '草稿', color: '#6b7280' }, active: { label: '生效', color: 'var(--color-success)' }, expired: { label: '已到期', color: 'var(--color-warning)' }, terminated: { label: '已终止', color: 'var(--color-danger)' } }
                const st = stMap[c.status] || stMap.draft
                return (
                  <div key={c.id} onClick={() => nav(`/clients/${c.client_id}`)} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{c.client_name}</span>
                        <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: st.color + '18', color: st.color }}>{st.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{c.title} · ¥{Number(c.amount || 0).toLocaleString()}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      {!stats && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>}
    </div>
  )
}
