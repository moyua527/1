import { Building2, Plus, LogIn } from 'lucide-react'
import Button from '../ui/Button'
import AdminAllEnterprises from './AdminAllEnterprises'
import JoinCreateModals from './JoinCreateModals'
import { section } from './constants'

interface Props {
  createModalOpen: boolean
  setCreateModalOpen: (v: boolean) => void
  createForm: any
  setCreateForm: (v: any) => void
  creating: boolean
  handleCreate: () => void
  joinModalOpen: boolean
  setJoinModalOpen: (v: boolean) => void
  joinSearch: string
  setJoinSearch: (v: string) => void
  joinResults: any[]
  setJoinResults: (v: any[]) => void
  joinSearching: boolean
  joining: boolean
  myRequests: any[]
  loadMyRequests: () => void
  handleJoinSearch: () => void
  handleJoin: (id: number) => void
  isSysAdmin: boolean
  allEnterprises: any[]
  expandedEntId: number | null
  setExpandedEntId: (id: number | null) => void
}

export default function EmptyState(props: Props) {
  const { createModalOpen, setCreateModalOpen, createForm, setCreateForm, creating, handleCreate,
    joinModalOpen, setJoinModalOpen, joinSearch, setJoinSearch, joinResults, setJoinResults, joinSearching, joining,
    myRequests, loadMyRequests, handleJoinSearch, handleJoin,
    isSysAdmin, allEnterprises, expandedEntId, setExpandedEntId } = props

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>企业管理</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 0 }}>创建并管理您的企业信息</p>
      <div style={{ ...section, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Building2 size={32} color="#fff" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>您还没有企业</div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>创建新企业或加入已有企业</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => setCreateModalOpen(true)}><Plus size={15} /> 创建企业</Button>
          <Button variant="secondary" onClick={() => { setJoinModalOpen(true); setJoinSearch(''); setJoinResults([]); loadMyRequests() }}><LogIn size={15} /> 加入企业</Button>
        </div>
      </div>

      <JoinCreateModals
        joinModalOpen={joinModalOpen} setJoinModalOpen={setJoinModalOpen}
        joinSearch={joinSearch} setJoinSearch={setJoinSearch}
        joinResults={joinResults} joinSearching={joinSearching} joining={joining}
        myRequests={myRequests} handleJoinSearch={handleJoinSearch} handleJoin={handleJoin}
        createModalOpen={createModalOpen} setCreateModalOpen={setCreateModalOpen}
        createForm={createForm} setCreateForm={setCreateForm}
        creating={creating} handleCreate={handleCreate}
      />

      {isSysAdmin && <AdminAllEnterprises allEnterprises={allEnterprises} expandedEntId={expandedEntId} setExpandedEntId={setExpandedEntId} />}
    </div>
  )
}
