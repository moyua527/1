import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchApi } from '../../../bootstrap'
import Avatar from '../../ui/Avatar'

const STATUS_LABELS: Record<string, string> = {
  completed: '已完成', in_progress: '执行中', pending_review: '待验收',
  submitted: '已提出', todo: '待办', disputed: '待补充', review_failed: '验收不通过',
}
const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981', in_progress: '#3b82f6', pending_review: '#8b5cf6',
  submitted: '#6366f1', todo: '#94a3b8', disputed: '#f59e0b', review_failed: '#ef4444',
}

const card: React.CSSProperties = {
  background: 'var(--bg-primary)', borderRadius: 14, padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-primary)',
}

export default function ProjectStatsTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi(`/api/projects/${projectId}/stats`).then(r => {
      if (r.success) setData(r.data)
      setLoading(false)
    })
  }, [projectId])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>加载中...</div>
  if (!data) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>暂无数据</div>

  const { summary, distribution, members, trend } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={18} color="var(--brand)" />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>统计看板</span>
      </div>

      {/* Summary Rings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <RingCard label="完成率" value={summary.completion_rate} color="#10b981" sub={`${summary.completed}/${summary.total}`} />
        <RingCard label="逾期率" value={summary.overdue_rate} color="#ef4444" sub={`${summary.overdue} 项逾期`} />
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)' }}>{summary.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>总需求</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: distribution.length > 0 && trend.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* Status Distribution */}
        {distribution.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>需求状态分布</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distribution.map((d: any) => ({ ...d, name: STATUS_LABELS[d.status] || d.status }))} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} animationDuration={500}>
                  {distribution.map((d: any, i: number) => <Cell key={i} fill={STATUS_COLORS[d.status] || '#94a3b8'} stroke="none" />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trend */}
        {trend.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>近30天趋势</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="created" name="新建" stroke="#3b82f6" fill="url(#gradC)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="completed" name="完成" stroke="#10b981" fill="url(#gradD)" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Member Rankings */}
      {members.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>成员任务统计</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={th}>成员</th>
                  <th style={th}>总计</th>
                  <th style={th}>已完成</th>
                  <th style={th}>执行中</th>
                  <th style={th}>待验收</th>
                  <th style={th}>逾期</th>
                  <th style={th}>完成率</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => {
                  const rate = m.total > 0 ? Math.round(m.completed / m.total * 100) : 0
                  return (
                    <tr key={m.user_id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={m.nickname || '?'} src={m.avatar} size={24} />
                          <span style={{ fontWeight: 500 }}>{m.nickname}</span>
                        </div>
                      </td>
                      <td style={{ ...td, fontWeight: 600 }}>{m.total}</td>
                      <td style={{ ...td, color: '#10b981' }}>{m.completed}</td>
                      <td style={{ ...td, color: '#3b82f6' }}>{m.in_progress}</td>
                      <td style={{ ...td, color: '#8b5cf6' }}>{m.pending_review}</td>
                      <td style={{ ...td, color: m.overdue > 0 ? '#ef4444' : 'var(--text-tertiary)' }}>{m.overdue}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
                            <div style={{ height: '100%', width: `${rate}%`, background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 3, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 28 }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Bar Chart */}
      {members.filter((m: any) => m.total > 0).length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>成员任务对比</div>
          <ResponsiveContainer width="100%" height={Math.max(200, members.filter((m: any) => m.total > 0).length * 40)}>
            <BarChart data={members.filter((m: any) => m.total > 0)} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="nickname" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="completed" name="已完成" fill="#10b981" radius={[0, 4, 4, 0]} stackId="stack" />
              <Bar dataKey="in_progress" name="执行中" fill="#3b82f6" radius={[0, 0, 0, 0]} stackId="stack" />
              <Bar dataKey="pending_review" name="待验收" fill="#8b5cf6" radius={[0, 0, 0, 0]} stackId="stack" />
              <Bar dataKey="overdue" name="逾期" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="stack" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function RingCard({ label, value, color, sub }: { label: string; value: number; color: string; sub: string }) {
  const radius = 36
  const stroke = 7
  const circ = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ
  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth={stroke} />
        <circle cx={45} cy={45} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 45 45)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x={45} y={42} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text-heading)">{value}%</text>
        <text x={45} y={58} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{label}</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '10px 10px', color: 'var(--text-primary)' }

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 12 }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-heading)' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.payload?.fill }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}
