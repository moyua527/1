import { useState, useEffect } from 'react'
import { clientApi } from '../client/services/api'
import { projectApi } from '../project/services/api'
import { toast } from '../ui/Toast'
import { section } from './constants'
import { fetchApi } from '../../bootstrap'

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

  // 对接人员选择弹窗
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [memberModalRequestId, setMemberModalRequestId] = useState<number | null>(null)
  const [enterpriseMembers, setEnterpriseMembers] = useState<any[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [memberLoading, setMemberLoading] = useState(false)
  const [approving, setApproving] = useState(false)

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
    // 打开对接人员选择弹窗
    setMemberModalRequestId(id)
    setSelectedMemberIds([])
    setMemberModalOpen(true)
    setMemberLoading(true)
    try {
      const r = await fetchApi('/api/my-enterprise')
      if (r.success && r.data?.members) {
        setEnterpriseMembers(r.data.members.filter((m: any) => m.user_id))
      }
    } catch { /* ignore */ }
    setMemberLoading(false)
  }

  const handleConfirmApprove = async () => {
    if (!memberModalRequestId) return
    setApproving(true)
    const r = await projectApi.approveClientRequest(memberModalRequestId, selectedMemberIds)
    setApproving(false)
    if (r.success) {
      toast('已同意项目关联', 'success')
      setMemberModalOpen(false)
      setMemberModalRequestId(null)
      load()
      onRefresh?.()
    } else {
      toast(r.message || '操作失败', 'error')
    }
  }

  const toggleMember = (userId: number) => {
    setSelectedMemberIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])
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

      {/* 对接人员选择弹窗 */}
      {memberModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMemberModalOpen(false)} />
          <div style={{ position: 'relative', background: 'var(--bg-primary)', borderRadius: 12, padding: 24, width: 420, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>选择对接人员</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>从企业成员中选择参与该项目的对接人员</p>

            {memberLoading ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>加载中...</div>
            ) : enterpriseMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无企业成员</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '40vh' }}>
                {enterpriseMembers.map((m: any) => {
                  const uid = m.user_id || m.id
                  const selected = selectedMemberIds.includes(uid)
                  return (
                    <div key={uid} onClick={() => toggleMember(uid)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${selected ? '#3b82f6' : 'var(--border-primary)'}`, background: selected ? '#eff6ff' : 'var(--bg-primary)', transition: 'all 0.15s' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${selected ? '#3b82f6' : '#d1d5db'}`, background: selected ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                        {(m.name || '?')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{m.name}</div>
                        {m.position && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.position}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                {selectedMemberIds.length > 0 ? `已选 ${selectedMemberIds.length} 人` : '可以不选，稍后再添加'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setMemberModalOpen(false)}
                  style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>取消</button>
                <button onClick={handleConfirmApprove} disabled={approving}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', cursor: approving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, opacity: approving ? 0.6 : 1 }}>
                  {approving ? '处理中...' : '确认同意'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
