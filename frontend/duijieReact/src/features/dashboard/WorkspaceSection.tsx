import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, FolderKanban, UserCheck, AlertTriangle, ChevronRight, Building2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'

const priorityColor: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: '#fef2f2', text: 'var(--color-danger)', label: '紧急' },
  high: { bg: '#fff7ed', text: 'var(--color-orange)', label: '高' },
  medium: { bg: '#fefce8', text: '#ca8a04', label: '中' },
  low: { bg: '#f0fdf4', text: 'var(--color-success)', label: '低' },
}
const statusLabel: Record<string, string> = { todo: '待办', in_progress: '进行中', pending_review: '待验收' }
const projStatus: Record<string, { color: string; label: string }> = {
  planning: { color: '#6b7280', label: '规划中' },
  in_progress: { color: 'var(--brand)', label: '进行中' },
  completed: { color: 'var(--color-success)', label: '已完成' },
  on_hold: { color: 'var(--color-warning)', label: '暂停' },
}

export default function WorkspaceSection({ isMobile = false }: { isMobile?: boolean }) {
  const [data, setData] = useState<any>(null)
  const nav = useNavigate()

  const load = useCallback(() => {
    fetchApi('/api/dashboard/workspace').then(r => { if (r.success) setData(r.data) })
  }, [])
  useEffect(load, [load])

  if (!data) return null

  const { myTasks, myProjects, pendingApprovals, pendingClientRequests, dueSoon } = data
  const hasContent = myTasks?.length || myProjects?.length || pendingApprovals?.length || pendingClientRequests?.length || dueSoon?.length
  if (!hasContent) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginTop: 24 }}>
      {/* 我的待办任务 */}
      {myTasks?.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={18} color="var(--brand)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>我的待办</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({myTasks.length})</span>
            </div>
            <button onClick={() => nav('/tasks')} style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          {myTasks.map((t: any) => {
            const p = priorityColor[t.priority] || priorityColor.medium
            return (
              <div key={t.id} onClick={() => nav(`/projects/${t.project_id}`)} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: p.bg, color: p.text, fontWeight: 600, flexShrink: 0 }}>{p.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap', wordBreak: 'break-word' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <span>{statusLabel[t.status] || t.status}</span>
                    {t.project_name && <span>· {t.project_name}</span>}
                    {t.due_date && <span>· {new Date(t.due_date).toLocaleDateString('zh-CN')}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 即将到期 */}
      {dueSoon?.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={18} color="var(--color-warning)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>即将到期</span>
            <span style={{ fontSize: 12, color: 'var(--color-warning)', background: '#fef3c7', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>{dueSoon.length}</span>
          </div>
          {dueSoon.map((t: any) => {
            const daysLeft = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86400000)
            const urgent = daysLeft <= 1
            return (
              <div key={t.id} onClick={() => nav(`/projects/${t.project_id}`)} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: urgent ? '#fef2f2' : '#fef3c7', color: urgent ? 'var(--color-danger)' : '#92400e', fontWeight: 600, flexShrink: 0 }}>
                  {daysLeft <= 0 ? '今天' : `${daysLeft}天后`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap', wordBreak: 'break-word' }}>{t.title}</div>
                  {t.project_name && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.project_name}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 我的项目 */}
      {myProjects?.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderKanban size={18} color="var(--color-purple)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>我的项目</span>
            </div>
            <button onClick={() => nav('/projects')} style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          {myProjects.map((p: any) => {
            const st = projStatus[p.status] || projStatus.planning
            const total = (p.open_tasks || 0) + (p.done_tasks || 0)
            const pct = total > 0 ? Math.round((p.done_tasks / total) * 100) : 0
            return (
              <div key={p.id} onClick={() => nav(`/projects/${p.id}`)} style={{ padding: '10px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 6 : 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{p.name}</div>
                  <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 4, background: st.color + '18', color: st.color, fontWeight: 500 }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: 'var(--brand)', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {p.open_tasks || 0} 进行中 · {p.done_tasks || 0} 已完成
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 待审批 */}
      {pendingApprovals?.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} color="var(--color-success)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>待审批</span>
              <span style={{ fontSize: 12, color: 'var(--color-danger)', background: '#fee2e2', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>{pendingApprovals.length}</span>
            </div>
            <button onClick={() => nav('/enterprise')} style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              去处理 <ChevronRight size={14} />
            </button>
          </div>
          {pendingApprovals.map((a: any) => (
            <div key={a.id} onClick={() => nav('/enterprise')} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border-secondary)', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-light-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--brand)', flexShrink: 0 }}>
                {(a.nickname || a.username || '?')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{a.nickname || a.username} 申请加入</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span>{a.enterprise_name}</span>
                  <span>· {new Date(a.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 项目关联审批 */}
      {pendingClientRequests?.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: isMobile ? 16 : 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Building2 size={18} color="var(--brand)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>企业关联请求</span>
            <span style={{ fontSize: 12, color: 'var(--color-danger)', background: '#fee2e2', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>{pendingClientRequests.length}</span>
          </div>
          {pendingClientRequests.map((r: any) => (
            <div key={r.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border-secondary)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)', marginBottom: 4 }}>
                {r.from_enterprise_name} 邀请加入项目「{r.project_name}」
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                发起人: {r.requested_by_name} · {new Date(r.created_at).toLocaleDateString('zh-CN')}
                {r.message && <span> · 留言: {r.message}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={async (e) => { e.stopPropagation(); const result = await fetchApi(`/api/projects/client-requests/${r.id}/approve`, { method: 'POST' }); if (result.success) { load() } }}
                  style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: 'var(--brand)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  同意
                </button>
                <button onClick={async (e) => { e.stopPropagation(); const result = await fetchApi(`/api/projects/client-requests/${r.id}/reject`, { method: 'POST', body: JSON.stringify({}) }); if (result.success) { load() } }}
                  style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', cursor: 'pointer', fontWeight: 500 }}>
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
