import Avatar from '../ui/Avatar'
import { section } from './constants'

interface Props {
  joinRequests: any[]
  handleApprove: (id: number) => void
  handleReject: (id: number) => void
}

export default function JoinRequests({ joinRequests, handleApprove, handleReject }: Props) {
  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
      {joinRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无待审批的加入申请</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {joinRequests.map((r: any) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fafbfc' }}>
              <Avatar name={r.nickname || r.username || ''} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{r.nickname || r.username}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 8, marginTop: 2 }}>
                  {r.phone && <span>{r.phone}</span>}
                  {r.email && <span>{r.email}</span>}
                  <span>申请于 {new Date(r.created_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleApprove(r.id)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>批准</button>
                <button onClick={() => handleReject(r.id)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>拒绝</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
