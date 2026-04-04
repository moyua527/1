import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Check, X, Copy } from 'lucide-react'
import Badge from '../../ui/Badge'
import { toast } from '../../ui/Toast'
import { projectApi } from '../services/api'
import { formatDateTime } from '../../../utils/datetime'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

interface Props {
  projectId: string
  joinCode: string | null
  onRefresh: () => void
}

export default function JoinRequestsTab({ projectId, joinCode, onRefresh }: Props) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    projectApi.getJoinRequests(projectId).then(r => {
      setRequests(r.success ? r.data || [] : [])
      setLoading(false)
    })
  }, [projectId])

  useEffect(() => { load() }, [load])

  const handleReview = async (requestId: number, action: 'approve' | 'reject') => {
    const r = action === 'approve'
      ? await projectApi.approveJoinRequest(projectId, requestId)
      : await projectApi.rejectJoinRequest(projectId, requestId)
    if (r.success) { toast(action === 'approve' ? '已通过' : '已拒绝', 'success'); load(); onRefresh() }
    else toast(r.message || '操作失败', 'error')
  }

  return (
    <div style={section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>加入申请</h3>
        {joinCode && (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace', cursor: 'pointer', padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-primary)' }}
            title="点击复制项目ID" onClick={() => { navigator.clipboard.writeText(joinCode); toast('已复制项目ID', 'success') }}>
            项目ID: {joinCode} <Copy size={10} style={{ verticalAlign: 'middle' }} />
          </span>
        )}
      </div>
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 24 }}>加载中...</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-tertiary)' }}>
          <UserPlus size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14 }}>暂无加入申请</p>
          <p style={{ margin: '4px 0 0', fontSize: 12 }}>分享项目ID给他人，即可收到加入申请</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {requests.map((req: any) => (
            <div key={req.id} style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{req.nickname || req.phone || req.username}</div>
                {req.invite_type === 'member' && req.inviter_name && (
                  <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>由 {req.inviter_name} 邀请</div>
                )}
                {req.message && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{req.message}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{formatDateTime(req.created_at)}</div>
              </div>
              {req.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleReview(req.id, 'approve')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    <Check size={12} /> 通过
                  </button>
                  <button onClick={() => handleReview(req.id, 'reject')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    <X size={12} /> 拒绝
                  </button>
                </div>
              ) : (
                <Badge color={req.status === 'approved' ? 'green' : 'gray'}>{req.status === 'approved' ? '已通过' : '已拒绝'}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
