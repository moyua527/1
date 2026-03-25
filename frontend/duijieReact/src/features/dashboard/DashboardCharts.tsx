import { Activity } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0284c7']
const taskStatusLabel: Record<string, string> = { todo: '待办', in_progress: '进行中', pending_review: '待验收', accepted: '已完成', done: '已完成' }
const oppStageLabel: Record<string, string> = { lead: '线索', qualify: '验证', proposal: '方案', negotiate: '谈判', won: '赢单', lost: '丢单' }

interface DashboardChartsProps {
  chartData: any
  days: number
  onDaysChange: (d: number) => void
  canClients: boolean
}

export default function DashboardCharts({ chartData, days, onDaysChange, canClients }: DashboardChartsProps) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} color="#2563eb" />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>数据趋势</span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
          {[{ d: 7, l: '7天' }, { d: 30, l: '30天' }, { d: 90, l: '90天' }].map(o => (
            <button key={o.d} onClick={() => onDaysChange(o.d)}
              style={{ padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: days === o.d ? '#fff' : 'transparent', color: days === o.d ? '#2563eb' : '#64748b', boxShadow: days === o.d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {chartData.taskTrend?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 12 }}>任务趋势</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData.taskTrend.map((d: any) => ({ ...d, date: d.date?.slice(5) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="created" name="新建" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="completed" name="完成" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {chartData.taskDist?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 12 }}>任务状态分布</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData.taskDist.map((d: any) => ({ ...d, name: taskStatusLabel[d.status] || d.status }))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, count }: any) => `${name}: ${count}`} labelLine={false}>
                  {chartData.taskDist.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {canClients && chartData.clientTrend?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 12 }}>新增客户趋势</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.clientTrend.map((d: any) => ({ ...d, date: d.date?.slice(5) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" name="新增客户" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {canClients && chartData.oppDist?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 12 }}>商机阶段分布</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.oppDist.map((d: any) => ({ ...d, stage: oppStageLabel[d.stage] || d.stage, amount: Math.round(Number(d.amount) / 10000) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="count" name="数量" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="amount" name="金额(万)" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
