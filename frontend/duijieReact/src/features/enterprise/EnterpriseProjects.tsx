import { useState, useEffect } from 'react'
import { FolderKanban, User, Calendar, TrendingUp } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { section } from './constants'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: '#64748b' },
  in_progress: { label: '进行中', color: '#2563eb' },
  review: { label: '评审中', color: '#d97706' },
  completed: { label: '已完成', color: '#16a34a' },
  on_hold: { label: '暂停', color: '#dc2626' },
}

export default function EnterpriseProjects() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi('/api/my-enterprise/projects').then(r => {
      if (r.success) setProjects(r.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', textAlign: 'center', padding: 40, color: '#94a3b8' }}>加载中...</div>

  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
          <FolderKanban size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div>暂无企业项目</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>共 {projects.length} 个项目</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map((p: any) => {
              const st = statusMap[p.status] || statusMap.planning
              return (
                <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FolderKanban size={16} color="#2563eb" />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                      <Badge color={st.color}>{st.label}</Badge>
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>#{p.id}</span>
                  </div>
                  {p.description && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 1.5 }}>{p.description.length > 100 ? p.description.slice(0, 100) + '...' : p.description}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      {p.internal_client_name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={12} /> 我方企业：{p.internal_client_name}</span>}
                      {p.client_name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={12} /> 客户企业：{p.client_name}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {p.creator_name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {p.creator_name}</span>}
                    {p.start_date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {p.start_date.slice(0, 10)}{p.end_date ? ' ~ ' + p.end_date.slice(0, 10) : ''}</span>}
                    </div>
                  </div>
                  {p.progress > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <ProgressBar value={p.progress} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
