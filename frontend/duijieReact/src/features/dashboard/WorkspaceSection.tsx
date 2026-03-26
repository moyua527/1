import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, FolderKanban, UserCheck, AlertTriangle, ChevronRight } from 'lucide-react'
import { fetchApi } from '../../bootstrap'

const priorityColor: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: '#fef2f2', text: '#dc2626', label: '紧急' },
  high: { bg: '#fff7ed', text: '#ea580c', label: '高' },
  medium: { bg: '#fefce8', text: '#ca8a04', label: '中' },
  low: { bg: '#f0fdf4', text: '#16a34a', label: '低' },
}
const statusLabel: Record<string, string> = { todo: '待办', in_progress: '进行中', pending_review: '待验收' }
const projStatus: Record<string, { color: string; label: string }> = {
  planning: { color: '#6b7280', label: '规划中' },
  in_progress: { color: '#2563eb', label: '进行中' },
  completed: { color: '#16a34a', label: '已完成' },
  on_hold: { color: '#d97706', label: '暂停' },
}

export default function WorkspaceSection() {
  const [data, setData] = useState<any>(null)
  const nav = useNavigate()

  const load = useCallback(() => {
    fetchApi('/api/dashboard/workspace').then(r => { if (r.success) setData(r.data) })
  }, [])
  useEffect(load, [load])

  if (!data) return null

  const { myTasks, myProjects, pendingApprovals, dueSoon } = data
  const hasContent = myTasks?.length || myProjects?.length || pendingApprovals?.length || dueSoon?.length
  if (!hasContent) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginTop: 24 }}>
      {/* 我的待办任务 */}
      {myTasks?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={18} color="#2563eb" />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>我的待办</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>({myTasks.length})</span>
            </div>
            <button onClick={() => nav('/tasks')} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          {myTasks.map((t: any) => {
            const p = priorityColor[t.priority] || priorityColor.medium
            return (
              <div key={t.id} onClick={() => nav(`/projects/${t.project_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: p.bg, color: p.text, fontWeight: 600, flexShrink: 0 }}>{p.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 8, marginTop: 2 }}>
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
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={18} color="#d97706" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>即将到期</span>
            <span style={{ fontSize: 12, color: '#d97706', background: '#fef3c7', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>{dueSoon.length}</span>
          </div>
          {dueSoon.map((t: any) => {
            const daysLeft = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86400000)
            const urgent = daysLeft <= 1
            return (
              <div key={t.id} onClick={() => nav(`/projects/${t.project_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: urgent ? '#fef2f2' : '#fef3c7', color: urgent ? '#dc2626' : '#92400e', fontWeight: 600, flexShrink: 0 }}>
                  {daysLeft <= 0 ? '今天' : `${daysLeft}天后`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  {t.project_name && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.project_name}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 我的项目 */}
      {myProjects?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderKanban size={18} color="#7c3aed" />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>我的项目</span>
            </div>
            <button onClick={() => nav('/projects')} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          {myProjects.map((p: any) => {
            const st = projStatus[p.status] || projStatus.planning
            const total = (p.open_tasks || 0) + (p.done_tasks || 0)
            const pct = total > 0 ? Math.round((p.done_tasks / total) * 100) : 0
            return (
              <div key={p.id} onClick={() => nav(`/projects/${p.id}`)} style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                  <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 4, background: st.color + '18', color: st.color, fontWeight: 500 }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: '#2563eb', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  {p.open_tasks || 0} 进行中 · {p.done_tasks || 0} 已完成
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 待审批 */}
      {pendingApprovals?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} color="#16a34a" />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>待审批</span>
              <span style={{ fontSize: 12, color: '#dc2626', background: '#fee2e2', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>{pendingApprovals.length}</span>
            </div>
            <button onClick={() => nav('/enterprise')} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              去处理 <ChevronRight size={14} />
            </button>
          </div>
          {pendingApprovals.map((a: any) => (
            <div key={a.id} onClick={() => nav('/enterprise')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#2563eb', flexShrink: 0 }}>
                {(a.nickname || a.username || '?')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{a.nickname || a.username} 申请加入</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.enterprise_name} · {new Date(a.created_at).toLocaleDateString('zh-CN')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
