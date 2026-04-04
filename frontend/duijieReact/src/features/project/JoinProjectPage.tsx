import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FolderKanban, Users, Clock, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { toast } from '../ui/Toast'
import { projectApi } from './services/api'
import useEnterpriseStore from '../../stores/useEnterpriseStore'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

export default function JoinProjectPage() {
  const { code } = useParams<{ code: string }>()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    projectApi.searchByCode(code).then(r => {
      if (r.success && r.data) setProject(r.data)
      else setError(r.message || '未找到该项目')
      setLoading(false)
    }).catch(() => {
      setError('加载失败，请检查网络')
      setLoading(false)
    })
  }, [code])

  const handleJoin = async () => {
    if (!project) return
    setJoining(true)
    try {
      const r = await projectApi.joinRequest(project.id)
      if (r.success) {
        toast('申请已提交，等待项目管理员审批', 'success')
        setProject({ ...project, has_pending_request: true })
      } else {
        toast(r.message || '申请失败', 'error')
      }
    } catch {
      toast('操作失败', 'error')
    }
    setJoining(false)
  }

  const goToProject = () => {
    useEnterpriseStore.getState().setHasProjects(true)
    nav(`/projects/${project.id}`)
  }

  const st = project ? (statusMap[project.status] || statusMap.planning) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f3ff 100%)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 28, border: '1px solid var(--border-primary)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderKanban size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>项目邀请</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>邀请码: {code}</div>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>加载项目信息...</div>}

          {error && (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{error}</div>
              <Button variant="secondary" onClick={() => nav('/')}><ArrowLeft size={14} style={{ marginRight: 4 }} /> 返回首页</Button>
            </div>
          )}

          {project && (
            <>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-primary)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>{project.name}</span>
                  {st && <Badge color={st.color}>{st.label}</Badge>}
                </div>
                {project.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{project.description}</div>}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <span>创建者: {project.creator_name || '未知'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {project.member_count || 0} 名成员</span>
                </div>
              </div>

              {project.is_member ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
                    <CheckCircle size={16} /> 你已经是该项目的成员
                  </div>
                  <Button onClick={goToProject}><ArrowRight size={14} style={{ marginRight: 4 }} /> 进入项目</Button>
                </div>
              ) : project.has_pending_request ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, color: '#92400e', fontSize: 14 }}>
                  <Clock size={16} /> 申请已提交，等待项目管理员审批
                </div>
              ) : (
                <Button onClick={handleJoin} disabled={joining} style={{ width: '100%' }}>
                  <ArrowRight size={16} style={{ marginRight: 4 }} />
                  {joining ? '申请中...' : '申请加入此项目'}
                </Button>
              )}
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}
