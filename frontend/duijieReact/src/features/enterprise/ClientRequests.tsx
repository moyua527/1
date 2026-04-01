import { useState, useEffect } from 'react'
import { clientApi } from '../client/services/api'
import { projectApi } from '../project/services/api'
import { toast } from '../ui/Toast'
import { section } from './constants'

interface Props {
  canAdmin: boolean
  onRefresh?: () => void
}

export default function ClientRequests({ canAdmin, onRefresh }: Props) {
  const [projectIncoming, setProjectIncoming] = useState<any[]>([])
  const [projectOutgoing, setProjectOutgoing] = useState<any[]>([])
  const [clientIncoming, setClientIncoming] = useState<any[]>([])
  const [clientOutgoing, setClientOutgoing] = useState<any[]>([])
  const [subTab, setSubTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [pIn, pOut, cIn, cOut] = await Promise.all([
      projectApi.getClientRequests(),
      projectApi.getSentClientRequests(),
      clientApi.incomingRequests(),
      clientApi.outgoingRequests(),
    ])
    if (pIn.success) setProjectIncoming(pIn.data || [])
    if (pOut.success) setProjectOutgoing(pOut.data || [])
    if (cIn.success) setClientIncoming(cIn.data || [])
    if (cOut.success) setClientOutgoing(cOut.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleProjectApprove = async (id: number) => {
    const r = await projectApi.approveClientRequest(id)
    if (r.success) { toast('已同意项目关联', 'success'); load(); onRefresh?.() }
    else toast(r.message || '操作失败', 'error')
  }
  const handleProjectReject = async (id: number) => {
    const r = await projectApi.rejectClientRequest(id)
    if (r.success) { toast('已拒绝', 'success'); load(); onRefresh?.() }
    else toast(r.message || '操作失败', 'error')
  }
  const handleClientApprove = async (id: number) => {
    const r = await clientApi.approveRequest(id)
    if (r.success) { toast('已同意', 'success'); load(); onRefresh?.() }
    else toast(r.message || '操作失败', 'error')
  }
  const handleClientReject = async (id: number) => {
    const r = await clientApi.rejectRequest(id)
    if (r.success) { toast('已拒绝', 'success'); load(); onRefresh?.() }
    else toast(r.message || '操作失败', 'error')
  }

  const statusBadge = (s: string) => {
    if (s === 'pending') return { text: '待审批', color: '#f59e0b', bg: '#fef3c7' }
    if (s === 'approved') return { text: '已同意', color: '#22c55e', bg: '#dcfce7' }
    return { text: '已拒绝', color: '#ef4444', bg: '#fee2e2' }
  }

  const allIncoming = [
    ...projectIncoming.map(r => ({ ...r, _type: 'project' as const })),
    ...clientIncoming.filter(r => r.status === 'pending').map(r => ({ ...r, _type: 'client' as const })),
  ]
  const allOutgoing = [
    ...projectOutgoing.map(r => ({ ...r, _type: 'project' as const })),
    ...clientOutgoing.map(r => ({ ...r, _type: 'client' as const })),
  ]
  const pendingCount = allIncoming.filter(r => r.status === 'pending').length

  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3, marginBottom: 16 }}>
        {[
          { key: 'incoming' as const, label: `收到的请求${pendingCount ? ` (${pendingCount})` : ''}` },
          { key: 'outgoing' as const, label: '发出的请求' },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: subTab === t.key ? 'var(--bg-primary)' : 'transparent',
              color: subTab === t.key ? 'var(--text-heading)' : 'var(--text-tertiary)',
              boxShadow: subTab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>加载中...</div>}

      {!loading && subTab === 'incoming' && (
        <>
          {allIncoming.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无收到的请求</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allIncoming.map((r: any) => {
              const isPending = r.status === 'pending'
              const st = statusBadge(r.status)
              const name = r._type === 'project' ? (r.from_enterprise_name || '未知企业') : (r.from_name || '未知企业')
              return (
                <div key={`${r._type}-${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: `1px solid ${isPending ? '#fcd34d' : 'var(--border-primary)'}`, borderRadius: 10, background: isPending ? '#fffbeb' : 'var(--bg-primary)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: r._type === 'project' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{name}</span>
                      <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: r._type === 'project' ? '#ede9fe' : '#dbeafe', color: r._type === 'project' ? '#7c3aed' : '#2563eb' }}>
                        {r._type === 'project' ? '项目关联' : '客户添加'}
                      </span>
                      {!isPending && <span style={{ fontSize: 12, fontWeight: 500, color: st.color, background: st.bg, padding: '1px 8px', borderRadius: 10 }}>{st.text}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {r._type === 'project' && r.project_name ? `项目: ${r.project_name} · ` : ''}
                      {r.message ? `${r.message} · ` : ''}
                      {new Date(r.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {isPending && canAdmin && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => r._type === 'project' ? handleProjectApprove(r.id) : handleClientApprove(r.id)}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>同意</button>
                      <button onClick={() => r._type === 'project' ? handleProjectReject(r.id) : handleClientReject(r.id)}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>拒绝</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && subTab === 'outgoing' && (
        <>
          {allOutgoing.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无发出的请求</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allOutgoing.map((r: any) => {
              const st = statusBadge(r.status)
              const name = r._type === 'project' ? (r.to_enterprise_name || '未知企业') : (r.to_name || '未知企业')
              return (
                <div key={`${r._type}-${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{name}</span>
                      <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: r._type === 'project' ? '#ede9fe' : '#dbeafe', color: r._type === 'project' ? '#7c3aed' : '#2563eb' }}>
                        {r._type === 'project' ? '项目关联' : '客户添加'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {r._type === 'project' && r.project_name ? `项目: ${r.project_name} · ` : ''}
                      {new Date(r.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: st.color, background: st.bg, padding: '2px 10px', borderRadius: 12 }}>{st.text}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
