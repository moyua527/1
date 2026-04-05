import { Activity } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CHART_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#0284c7']
const taskStatusLabel: Record<string, string> = { todo: '待办', submitted: '已提出', disputed: '待补充', in_progress: '执行中', pending_review: '待验收', review_failed: '验收不通过', accepted: '验收通过', done: '已完成' }
const oppStageLabel: Record<string, string> = { lead: '线索', qualify: '验证', proposal: '方案', negotiate: '谈判', won: '赢单', lost: '丢单' }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: 12 }}>
      <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.payload?.fill }} />
        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{d.name}</span>
      </div>
      <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>数量: <b style={{ color: 'var(--text-primary)' }}>{d.value}</b></div>
    </div>
  )
}

interface DashboardChartsProps {
  chartData: any
  days: number
  onDaysChange: (d: number) => void
  canClients: boolean
  isMobile: boolean
}

/** 将日期字符串规范为 MM-DD */
function fmtDate(d: string) {
  if (!d) return ''
  // 可能是 "2026-03-24" 或 "2026-03-24T00:00:00.000Z"
  const s = typeof d === 'string' ? d : new Date(d).toISOString()
  return s.slice(5, 10)  // "03-24"
}

/** 补全缺失日期，确保每天都有数据点 */
function fillDates(data: any[], days: number, valueKeys: string[]) {
  if (!data || data.length === 0) return data
  const endDate = new Date()
  endDate.setHours(0, 0, 0, 0)
  const result: any[] = []
  const dataMap = new Map<string, any>()
  data.forEach(d => {
    const key = fmtDate(d.date)
    dataMap.set(key, d)
  })
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(endDate)
    dt.setDate(dt.getDate() - i)
    const key = `${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    if (dataMap.has(key)) {
      result.push({ ...dataMap.get(key), date: key })
    } else {
      const empty: any = { date: key }
      valueKeys.forEach(k => empty[k] = 0)
      result.push(empty)
    }
  }
  return result
}

export default function DashboardCharts({ chartData, days, onDaysChange, canClients, isMobile }: DashboardChartsProps) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} color="var(--brand)" />
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>数据趋势</span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3, width: isMobile ? '100%' : undefined, justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          {[{ d: 7, l: '7天' }, { d: 30, l: '30天' }, { d: 90, l: '90天' }].map(o => (
            <button key={o.d} onClick={() => onDaysChange(o.d)}
              style={{ padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: days === o.d ? 'var(--bg-primary)' : 'transparent', color: days === o.d ? 'var(--brand)' : 'var(--text-secondary)', boxShadow: days === o.d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', flex: isMobile ? 1 : undefined }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {chartData.taskTrend?.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: isMobile ? 16 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>需求趋势</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={fillDates(chartData.taskTrend, days, ['created', 'completed'])}>
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="created" name="新建" stroke="#6366f1" fill="url(#gradCreated)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
                <Area type="monotone" dataKey="completed" name="完成" stroke="#14b8a6" fill="url(#gradCompleted)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {chartData.taskDist?.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: isMobile ? 16 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>需求状态分布</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartData.taskDist.map((d: any) => ({ ...d, name: taskStatusLabel[d.status] || d.status }))}
                  dataKey="count" nameKey="name" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={85}
                  paddingAngle={3}
                  label={({ name, count }: any) => `${name}: ${count}`}
                  labelLine={{ stroke: 'var(--text-tertiary)', strokeWidth: 1 }}
                  animationBegin={0} animationDuration={800}
                >
                  {chartData.taskDist.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {canClients && chartData.clientTrend?.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: isMobile ? 16 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>新增客户趋势</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={fillDates(chartData.clientTrend, days, ['count'])} barCategoryGap="25%">
                <defs>
                  <linearGradient id="gradClient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="新增客户" fill="url(#gradClient)" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {canClients && chartData.oppDist?.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: isMobile ? 16 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>商机阶段分布</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData.oppDist.map((d: any) => ({ ...d, stage: oppStageLabel[d.stage] || d.stage, amount: Math.round(Number(d.amount) / 10000) }))} barCategoryGap="20%">
                <defs>
                  <linearGradient id="gradOppCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="gradOppAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fcd34d" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="count" name="数量" fill="url(#gradOppCount)" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Bar yAxisId="right" dataKey="amount" name="金额(万)" fill="url(#gradOppAmount)" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
