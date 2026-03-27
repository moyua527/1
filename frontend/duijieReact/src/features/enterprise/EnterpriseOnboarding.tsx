import { useEffect } from 'react'
import { Building2, Plus, LogIn, LogOut } from 'lucide-react'
import Button from '../ui/Button'
import { useEnterprise } from './useEnterprise'
import JoinCreateModals from './JoinCreateModals'
import useUserStore from '../../stores/useUserStore'

export default function EnterpriseOnboarding() {
  const h = useEnterprise()
  const user = useUserStore(s => s.user)
  const logout = useUserStore(s => s.logout)

  useEffect(() => {
    if (h.data) useUserStore.getState().setHasEnterprise(true)
  }, [h.data])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f3ff 100%)', padding: 20 }}>
      <div style={{ position: 'absolute', top: 20, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>{user?.nickname || user?.username}</span>
        <button onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>
          <LogOut size={14} /> 退出
        </button>
      </div>

      <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
        <Building2 size={40} color="#fff" />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>欢迎使用对接平台</h1>
      <p style={{ fontSize: 16, color: '#64748b', marginBottom: 8, textAlign: 'center', maxWidth: 400 }}>
        开始之前，请先创建您的企业或加入已有企业
      </p>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 40, textAlign: 'center' }}>
        企业是协作的基础，所有项目、客户、任务都在企业下管理
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ width: 260, padding: '32px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => h.setCreateModalOpen(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Plus size={28} color="#2563eb" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>创建企业</div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
            创建您的企业空间<br />邀请成员一起协作
          </div>
        </div>

        <div style={{ width: 260, padding: '32px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={h.openJoinModal}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <LogIn size={28} color="#16a34a" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>加入企业</div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
            搜索并申请加入<br />已有企业的团队
          </div>
        </div>
      </div>

      {h.myRequests.filter((r: any) => r.status === 'pending').length > 0 && (
        <div style={{ marginTop: 32, padding: '16px 24px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 12, maxWidth: 540, width: '100%' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>待审批的申请</div>
          {h.myRequests.filter((r: any) => r.status === 'pending').map((r: any) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <Building2 size={16} color="#f59e0b" />
              <span style={{ flex: 1, fontSize: 14, color: '#0f172a' }}>{r.enterprise_name}</span>
              <span style={{ fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 6 }}>等待审批</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#b45309', marginTop: 8 }}>审批通过后刷新页面即可进入平台</div>
          <Button variant="secondary" onClick={() => window.location.reload()} style={{ marginTop: 8 }}>刷新页面</Button>
        </div>
      )}

      <JoinCreateModals
        joinModalOpen={h.joinModalOpen} setJoinModalOpen={h.setJoinModalOpen}
        joinSearch={h.joinSearch} setJoinSearch={h.setJoinSearch}
        joinResults={h.joinResults} joinSearching={h.joinSearching} joining={h.joining}
        selectedJoinEnterpriseId={h.selectedJoinEnterpriseId} setSelectedJoinEnterpriseId={h.setSelectedJoinEnterpriseId}
        joinCode={h.joinCode} setJoinCode={h.setJoinCode}
        myRequests={h.myRequests} handleJoinSearch={h.handleJoinSearch} handleJoin={h.handleJoin}
        createModalOpen={h.createModalOpen} setCreateModalOpen={h.setCreateModalOpen}
        createForm={h.createForm} setCreateForm={h.setCreateForm}
        creating={h.creating} handleCreate={h.handleCreate}
      />
    </div>
  )
}
