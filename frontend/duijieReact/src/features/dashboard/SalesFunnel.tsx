import { useNavigate } from 'react-router-dom'
import { Users, Bell, AlertTriangle, Clock, MessageSquare, FileSignature } from 'lucide-react'

const stageConfig = [
  { key: 'potential', label: '潜在客户', color: '#6b7280', bg: '#f3f4f6' },
  { key: 'intent', label: '意向客户', color: 'var(--brand)', bg: 'var(--brand-light-2)' },
  { key: 'signed', label: '签约客户', color: 'var(--color-purple)', bg: '#ede9fe' },
  { key: 'active', label: '合作中', color: 'var(--color-success)', bg: '#dcfce7' },
  { key: 'lost', label: '流失', color: 'var(--color-danger)', bg: '#fee2e2' },
]

const contractStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#6b7280' },
  active: { label: '生效', color: 'var(--color-success)' },
  expired: { label: '已到期', color: 'var(--color-warning)' },
  terminated: { label: '已终止', color: 'var(--color-danger)' },
}

interface ClientStages { potential: number; intent: number; signed: number; active: number; lost: number }

export function SalesFunnel({ stages, isMobile }: { stages: ClientStages; isMobile: boolean }) {
  const nav = useNavigate()
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
}

interface FollowUpAlertsProps { overdue: number; upcoming: number; isMobile: boolean }

export function FollowUpAlerts({ overdue, upcoming, isMobile }: FollowUpAlertsProps) {
  const nav = useNavigate()
  if (overdue <= 0 && upcoming <= 0) return null

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <Bell size={20} color="var(--color-warning)" />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>跟进提醒</span>
      </div>
      {overdue > 0 && (
        <div onClick={() => nav('/clients')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#fef2f2', cursor: 'pointer', border: '1px solid #fecaca', width: isMobile ? '100%' : undefined }}>
          <AlertTriangle size={16} color="var(--color-danger)" />
          <span style={{ fontSize: 14, color: 'var(--color-danger)', fontWeight: 600 }}>{overdue} 位客户</span>
          <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>跟进已过期</span>
        </div>
      )}
      {upcoming > 0 && (
        <div onClick={() => nav('/clients')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#fffbeb', cursor: 'pointer', border: '1px solid #fde68a', width: isMobile ? '100%' : undefined }}>
          <Clock size={16} color="var(--color-warning)" />
          <span style={{ fontSize: 14, color: 'var(--color-warning)', fontWeight: 600 }}>{upcoming} 位客户</span>
          <span style={{ fontSize: 13, color: 'var(--color-warning)' }}>3天内需跟进</span>
        </div>
      )}
    </div>
  )
}

interface RecentActivityProps { followUps?: any[]; contracts?: any[]; isMobile: boolean }

export function RecentActivity({ followUps, contracts, isMobile }: RecentActivityProps) {
  const nav = useNavigate()
  const hasFollowUps = (followUps?.length || 0) > 0
  const hasContracts = (contracts?.length || 0) > 0
  if (!hasFollowUps && !hasContracts) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 24 }}>
      {hasFollowUps && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <MessageSquare size={18} color="var(--brand)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>最近跟进</span>
          </div>
          {followUps!.map((f: any) => (
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
      {hasContracts && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FileSignature size={18} color="var(--color-success)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>最近合同</span>
          </div>
          {contracts!.map((c: any) => {
            const st = contractStatusMap[c.status] || contractStatusMap.draft
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
  )
}
