import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, PieChart, Loader2, FileSignature, Users } from 'lucide-react'

const fetchApi = async (url: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
  return res.json()
}

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const stageLabel: Record<string, string> = { potential: '潜在', intent: '意向', signed: '签约', active: '合作中', lost: '流失' }
const stageColors: Record<string, string> = { potential: '#94a3b8', intent: '#3b82f6', signed: '#7c3aed', active: '#16a34a', lost: '#dc2626' }
const channelColors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export default function Report() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi('/api/dashboard/report').then(r => { if (r.success) setData(r.data) }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} /></div>
  if (!data) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>暂无数据</div>

  const funnelStages = ['potential', 'intent', 'signed', 'active', 'lost'] as const
  const funnelMax = Math.max(...funnelStages.map(s => data.funnel[s] || 0), 1)

  const followDates = data.followTrend || []
  const followMax = Math.max(...followDates.map((d: any) => d.count), 1)

  const clientDates = data.clientTrend || []
  const clientMax = Math.max(...clientDates.map((d: any) => d.count), 1)

  const channelTotal = (data.channelDist || []).reduce((s: number, c: any) => s + c.count, 0) || 1

  const contractMonths = data.contractTrend || []
  const contractMax = Math.max(...contractMonths.map((m: any) => Number(m.total)), 1)

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>数据报表</h1>
      <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: 14 }}>销售漏斗、跟进趋势、渠道分布、合同统计</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 漏斗转化 */}
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={18} color="#3b82f6" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>销售漏斗</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnelStages.map((s, i) => {
              const count = data.funnel[s] || 0
              const width = (count / funnelMax) * 100
              const prevCount = i > 0 ? (data.funnel[funnelStages[i - 1]] || 0) : 0
              const rate = i > 0 && prevCount > 0 ? ((count / prevCount) * 100).toFixed(0) : null
              return (
                <div key={s}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{stageLabel[s]}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      {count} 家
                      {rate && <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>转化 {rate}%</span>}
                    </span>
                  </div>
                  <div style={{ height: 20, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${width}%`, background: stageColors[s], borderRadius: 4, transition: 'width 0.5s', minWidth: count > 0 ? 4 : 0 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 渠道分布 */}
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <PieChart size={18} color="#f59e0b" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>渠道分布</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.channelDist || []).map((c: any, i: number) => {
              const pct = ((c.count / channelTotal) * 100).toFixed(1)
              return (
                <div key={c.channel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: '#334155' }}>{c.channel}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 10, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: channelColors[i % channelColors.length], borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
            {(data.channelDist || []).length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>暂无数据</div>}
          </div>
        </div>

        {/* 跟进趋势 */}
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} color="#16a34a" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>跟进趋势 (近30天)</span>
          </div>
          {followDates.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 30 }}>暂无跟进记录</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
              {followDates.map((d: any) => (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={`${d.date}: ${d.count}次`}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{d.count}</div>
                  <div style={{ width: '100%', maxWidth: 20, height: `${(d.count / followMax) * 90}%`, minHeight: 4, background: '#16a34a', borderRadius: 2, transition: 'height 0.3s' }} />
                </div>
              ))}
            </div>
          )}
          {followDates.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
              <span>{followDates[0]?.date?.slice(5)}</span>
              <span>{followDates[followDates.length - 1]?.date?.slice(5)}</span>
            </div>
          )}
        </div>

        {/* 新增客户趋势 */}
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={18} color="#7c3aed" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>新增客户 (近30天)</span>
          </div>
          {clientDates.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 30 }}>暂无数据</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
              {clientDates.map((d: any) => (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={`${d.date}: ${d.count}个`}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{d.count}</div>
                  <div style={{ width: '100%', maxWidth: 20, height: `${(d.count / clientMax) * 90}%`, minHeight: 4, background: '#7c3aed', borderRadius: 2, transition: 'height 0.3s' }} />
                </div>
              ))}
            </div>
          )}
          {clientDates.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
              <span>{clientDates[0]?.date?.slice(5)}</span>
              <span>{clientDates[clientDates.length - 1]?.date?.slice(5)}</span>
            </div>
          )}
        </div>

        {/* 合同趋势 */}
        <div style={{ ...section, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FileSignature size={18} color="#d97706" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>合同金额趋势 (近6月)</span>
          </div>
          {contractMonths.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 30 }}>暂无合同数据</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {contractMonths.map((m: any) => {
                const total = Number(m.total)
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#334155', fontWeight: 500, marginBottom: 4 }}>¥{(total / 10000).toFixed(1)}万</div>
                    <div style={{ width: '100%', maxWidth: 48, height: `${(total / contractMax) * 100}%`, minHeight: 6, background: 'linear-gradient(180deg, #f59e0b, #d97706)', borderRadius: 4, transition: 'height 0.3s' }} />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{m.month.slice(5)}月</div>
                    <div style={{ fontSize: 10, color: '#cbd5e1' }}>{m.count}笔</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
