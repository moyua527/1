import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Loader2, DollarSign, Calendar, User, Trash2, Edit3, TrendingUp } from 'lucide-react'
import { clientApi } from '../client/services/api'
import { can } from '../../stores/permissions'
import { useOpportunities, useInvalidate } from '../../hooks/useApi'
import useLiveData from '../../hooks/useLiveData'
import Button from '../ui/Button'
import PageHeader from '../ui/PageHeader'
import StatsCards from '../ui/StatsCards'
import EmptyState from '../ui/EmptyState'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import OpportunityFormModal from './OpportunityFormModal'

const stageMap: Record<string, { label: string; color: string; bg: string }> = {
  lead: { label: '线索', color: '#6b7280', bg: '#f3f4f6' },
  qualify: { label: '验证', color: 'var(--brand)', bg: 'var(--brand-light-2)' },
  proposal: { label: '方案', color: 'var(--color-purple)', bg: '#ede9fe' },
  negotiate: { label: '谈判', color: 'var(--color-warning)', bg: '#fef3c7' },
  won: { label: '赢单', color: 'var(--color-success)', bg: '#dcfce7' },
  lost: { label: '丢单', color: 'var(--color-danger)', bg: '#fee2e2' },
}
const stageKeys = ['lead', 'qualify', 'proposal', 'negotiate', 'won', 'lost']

export default function OpportunityList() {
  const { data: items = [], isLoading: loading } = useOpportunities()
  const invalidate = useInvalidate()
  const refresh = () => invalidate('opportunities')
  useLiveData(['opportunity'], refresh)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const loadFormData = () => {
    clientApi.list().then(r => { if (r.success) setClients(r.data || []) })
    clientApi.availableMembers().then(r => { if (r.success) setStaffMembers((r.data || []).filter((u: any) => can(u.role, 'staff:assignable'))) })
  }

  const openCreate = () => {
    setEditing(null)
    loadFormData()
    setModalOpen(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    loadFormData()
    setModalOpen(true)
  }

  const handleDelete = async (item: any) => {
    if (!(await confirm({ message: `确定删除商机"${item.title}"？`, danger: true }))) return
    const r = await clientApi.deleteOpportunity(item.id)
    if (r.success) { toast('商机已删除', 'success'); refresh() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleStageChange = async (item: any, newStage: string) => {
    const r = await clientApi.updateOpportunity(item.id, { stage: newStage })
    if (r.success) refresh()
    else toast(r.message || '移动失败', 'error')
  }

  const totalAmount = items.filter(i => i.stage !== 'lost').reduce((s, i) => s + Number(i.amount || 0), 0)
  const wonAmount = items.filter(i => i.stage === 'won').reduce((s, i) => s + Number(i.amount || 0), 0)

  const closedItems = items.filter(i => i.stage === 'won' || i.stage === 'lost')
  const winRate = closedItems.length > 0 ? ((items.filter(i => i.stage === 'won').length / closedItems.length) * 100).toFixed(0) : '0'

  return (
    <div>
      <PageHeader title="商机管理" subtitle={`销售管道 · 共 ${items.length} 个商机`}
        actions={<Button onClick={openCreate}><Plus size={16} /> 新建商机</Button>} />

      <StatsCards cards={[
        { label: '管道总额', value: `¥${(totalAmount / 10000).toFixed(1)}万`, icon: DollarSign, color: 'var(--color-purple)', tone: 'rgba(124,58,237,0.12)' },
        { label: '赢单金额', value: `¥${(wonAmount / 10000).toFixed(1)}万`, icon: TrendingUp, color: 'var(--color-success)', tone: 'rgba(34,197,94,0.12)' },
        { label: '赢单率', value: `${winRate}%`, icon: TrendingUp, color: 'var(--color-warning)', tone: 'rgba(245,158,11,0.12)' },
      ]} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={TrendingUp} title="暂无商机" subtitle="点击右上角新建商机" />
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
          {stageKeys.map(stageKey => {
            const s = stageMap[stageKey]
            const stageItems = items.filter(i => (i.stage || 'lead') === stageKey)
            const stageTotal = stageItems.reduce((sum, i) => sum + Number(i.amount || 0), 0)
            return (
              <div key={stageKey}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stageKey) }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={e => { e.preventDefault(); setDragOverStage(null); const oid = e.dataTransfer.getData('opportunityId'); if (oid) { const item = items.find(i => String(i.id) === oid); if (item && item.stage !== stageKey) handleStageChange(item, stageKey) } }}
                style={{ minWidth: isMobile ? 220 : 160, flex: '1 1 0', background: dragOverStage === stageKey ? 'var(--bg-selected)' : 'var(--bg-secondary)', borderRadius: 12, padding: 12, border: dragOverStage === stageKey ? '2px dashed #2563eb' : '2px solid transparent', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--border-primary)', padding: '1px 8px', borderRadius: 10 }}>{stageItems.length}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>¥{(stageTotal / 10000).toFixed(1)}万</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stageItems.map(item => (
                    <div key={item.id} draggable
                      onDragStart={e => e.dataTransfer.setData('opportunityId', String(item.id))}
                      style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-primary)', cursor: 'grab', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', flex: 1 }}>{item.title}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-secondary)' }}><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {item.client_name && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.client_name}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                        {Number(item.amount) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><DollarSign size={12} /> ¥{Number(item.amount).toLocaleString()}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{item.probability}%</span>
                        {item.expected_close && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Calendar size={12} /> {item.expected_close.slice(0, 10)}</span>}
                      </div>
                      {item.assigned_name && <div style={{ fontSize: 11, color: 'var(--color-purple)', marginTop: 6 }}><User size={11} /> {item.assigned_name}</div>}
                      {stageKey !== 'won' && stageKey !== 'lost' && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {stageKeys.filter(k => k !== stageKey && k !== 'lost').map(k => (
                            <button key={k} onClick={() => handleStageChange(item, k)}
                              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: `1px solid ${stageMap[k].color}20`, background: stageMap[k].bg, color: stageMap[k].color, cursor: 'pointer', fontWeight: 500 }}>
                              → {stageMap[k].label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <OpportunityFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} clients={clients} staffMembers={staffMembers} onSaved={refresh} />
    </div>
  )
}
