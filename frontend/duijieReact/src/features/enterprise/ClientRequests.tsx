import { useState, useEffect } from 'react'
import { clientApi } from '../client/services/api'
import { toast } from '../ui/Toast'
import { section } from './constants'

interface Props {
  canAdmin: boolean
  onRefresh?: () => void
}

export default function ClientRequests({ canAdmin, onRefresh }: Props) {
  const [incoming, setIncoming] = useState<any[]>([])
  const [outgoing, setOutgoing] = useState<any[]>([])
  const [subTab, setSubTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [inRes, outRes] = await Promise.all([clientApi.incomingRequests(), clientApi.outgoingRequests()])
    if (inRes.success) setIncoming(inRes.data || [])
    if (outRes.success) setOutgoing(outRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id: number) => {
    const r = await clientApi.approveRequest(id)
    if (r.success) { toast('已同意', 'success'); load(); onRefresh?.() }
    else toast(r.message || '操作失败', 'error')
  }

  const handleReject = async (id: number) => {
    const r = await clientApi.rejectRequest(id)
    if (r.success) { toast('已拒绝', 'success'); load() }
    else toast(r.message || '操作失败', 'error')
  }

  const statusLabel = (s: string) => {
    if (s === 'pending') return { text: '待审批', color: '#f59e0b', bg: '#fef3c7' }
    if (s === 'approved') return { text: '已同意', color: '#22c55e', bg: '#dcfce7' }
    return { text: '已拒绝', color: '#ef4444', bg: '#fee2e2' }
  }

  const pendingIncoming = incoming.filter(r => r.status === 'pending')
  const historyIncoming = incoming.filter(r => r.status !== 'pending')

  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3, marginBottom: 16 }}>
        {[
          { key: 'incoming' as const, label: `收到的请求${pendingIncoming.length ? ` (${pendingIncoming.length})` : ''}` },
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
          {pendingIncoming.length === 0 && historyIncoming.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无收到的客户添加请求</div>
          )}
          {pendingIncoming.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: historyIncoming.length ? 16 : 0 }}>
              {pendingIncoming.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid #fcd34d', borderRadius: 10, background: '#fffbeb' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {(r.from_name || '?')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{r.from_name || '未知企业'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {r.from_company || ''}{r.message ? ` · ${r.message}` : ''} · 请求时间 {new Date(r.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {canAdmin && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleApprove(r.id)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>同意</button>
                      <button onClick={() => handleReject(r.id)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>拒绝</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {historyIncoming.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>历史记录</div>
              {historyIncoming.map((r: any) => {
                const st = statusLabel(r.status)
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{r.from_name || '未知企业'}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8 }}>{new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: st.color, background: st.bg, padding: '2px 10px', borderRadius: 12 }}>{st.text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {!loading && subTab === 'outgoing' && (
        <>
          {outgoing.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无发出的客户添加请求</div>
          )}
          {outgoing.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {outgoing.map((r: any) => {
                const st = statusLabel(r.status)
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                      {(r.to_name || '?')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{r.to_name || '未知企业'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{new Date(r.created_at).toLocaleString('zh-CN')}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: st.color, background: st.bg, padding: '2px 10px', borderRadius: 12 }}>{st.text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
