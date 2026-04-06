import { FolderKanban, TrendingUp, CheckCircle, MessageSquare, FileSignature, FileText, Download } from 'lucide-react'

interface Stats {
  totalProjects: number; activeProjects: number; completedProjects: number
  totalClients: number; totalTasks: number; pendingTasks: number; completedTasks: number
  clientStages?: { potential: number; intent: number; signed: number; active: number; lost: number }
  contracts?: { total: number; totalAmount: number; activeCount: number; activeAmount: number }
  followUpAlerts?: { overdue: number; upcoming: number }
  recentFollowUps?: any[]
  recentContracts?: any[]
  projects?: any[]
  files?: any[]
}

const card: React.CSSProperties = {
  background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow 0.15s',
}
const iconBox = (bg: string): React.CSSProperties => ({
  width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
})

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: '规划中', color: '#6b7280', bg: '#f3f4f6' },
  in_progress: { label: '进行中', color: 'var(--brand)', bg: 'var(--brand-light-2)' },
  review: { label: '验收中', color: 'var(--color-warning)', bg: '#fef3c7' },
  completed: { label: '已完成', color: 'var(--color-success)', bg: '#dcfce7' },
  on_hold: { label: '暂停', color: 'var(--color-danger)', bg: '#fee2e2' },
}
const contractStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#6b7280' }, active: { label: '生效', color: 'var(--color-success)' },
  expired: { label: '已到期', color: 'var(--color-warning)' }, terminated: { label: '已终止', color: 'var(--color-danger)' },
}

export default function ClientDashboard({ stats, nav }: { stats: Stats; nav: (p: string) => void }) {
  const projects = stats.projects || []
  const files = stats.files || []
  const contracts = (stats as any).contracts || []

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>客户门户</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>欢迎回来，以下是您的项目概览</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: '我的项目', value: stats.totalProjects, icon: FolderKanban, bg: 'var(--brand-light-2)', color: 'var(--brand)', path: '/projects' },
          { label: '进行中', value: stats.activeProjects, icon: TrendingUp, bg: '#fef3c7', color: 'var(--color-warning)', path: '/projects' },
          { label: '已完成', value: stats.completedProjects, icon: CheckCircle, bg: '#dcfce7', color: 'var(--color-success)', path: '/projects' },
          { label: '未读消息', value: (stats as any).unreadMessages || 0, icon: MessageSquare, bg: '#fee2e2', color: 'var(--color-danger)', path: '/messaging' },
        ].map(item => (
          <div key={item.label} style={card} onClick={() => nav(item.path)}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
            <div style={iconBox(item.bg)}><item.icon size={22} color={item.color} /></div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)' }}>{item.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Projects with progress */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FolderKanban size={18} color="var(--brand)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>我的项目</span>
          </div>
          {projects.length === 0 ? <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 20, textAlign: 'center' }}>暂无项目</div> :
            projects.map((p: any) => {
              const st = statusMap[p.status] || statusMap.planning
              return (
                <div key={p.id} onClick={() => nav(`/projects/${p.id}`)} style={{ padding: '12px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${p.progress || 0}%`, height: '100%', background: st.color, borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    <span>进度 {p.progress || 0}%</span>
                    {p.end_date && <span>截止 {new Date(p.end_date).toLocaleDateString('zh-CN')}</span>}
                  </div>
                </div>
              )
            })
          }
        </div>

        {/* Contracts */}
        {contracts.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileSignature size={18} color="var(--color-success)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>我的合同</span>
            </div>
            {contracts.map((c: any) => {
              const cst = contractStatusMap[c.status] || contractStatusMap.draft
              return (
                <div key={c.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{c.title}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: cst.color + '18', color: cst.color, fontWeight: 500 }}>{cst.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    ¥{Number(c.amount || 0).toLocaleString()}
                    {c.signed_date && ` · ${new Date(c.signed_date).toLocaleDateString('zh-CN')}`}
                    {c.expire_date && ` ~ ${new Date(c.expire_date).toLocaleDateString('zh-CN')}`}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent files */}
        {files.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileText size={18} color="var(--color-purple)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>最新交付文件</span>
            </div>
            {files.map((f: any) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}
                onClick={() => window.open(`/api/files/${f.id}/download`, '_blank')}>
                <Download size={14} color="var(--color-purple)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{f.project_name} · {new Date(f.created_at).toLocaleDateString('zh-CN')} · {(f.size / 1024).toFixed(0)}KB</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
