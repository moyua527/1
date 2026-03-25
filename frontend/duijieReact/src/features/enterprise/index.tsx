import { Users, Building, FolderTree, LogIn, ArrowLeftRight, Crown, Shield, Plus } from 'lucide-react'
import { useEnterprise } from './useEnterprise'
import { section } from './constants'
import EmptyState from './EmptyState'
import EnterpriseCard from './EnterpriseCard'
import MemberList from './MemberList'
import DepartmentList from './DepartmentList'
import OrgTree from './OrgTree'
import JoinRequests from './JoinRequests'
import AdminAllEnterprises from './AdminAllEnterprises'
import EnterpriseModals from './EnterpriseModals'
import JoinCreateModals from './JoinCreateModals'

export default function Enterprise() {
  const h = useEnterprise()

  if (h.loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  if (!h.data) return (
    <EmptyState
      createModalOpen={h.createModalOpen} setCreateModalOpen={h.setCreateModalOpen}
      createForm={h.createForm} setCreateForm={h.setCreateForm}
      creating={h.creating} handleCreate={h.handleCreate}
      joinModalOpen={h.joinModalOpen} setJoinModalOpen={h.setJoinModalOpen}
      joinSearch={h.joinSearch} setJoinSearch={h.setJoinSearch}
      joinResults={h.joinResults} setJoinResults={h.setJoinResults}
      joinSearching={h.joinSearching} joining={h.joining}
      myRequests={h.myRequests} loadMyRequests={h.loadMyRequests}
      handleJoinSearch={h.handleJoinSearch} handleJoin={h.handleJoin}
      isSysAdmin={h.isSysAdmin} allEnterprises={h.allEnterprises}
      expandedEntId={h.expandedEntId} setExpandedEntId={h.setExpandedEntId}
    />
  )

  const tabItems = [
    { key: 'members' as const, label: '组织成员', icon: <Users size={15} />, count: h.members.length },
    { key: 'departments' as const, label: '部门管理', icon: <Building size={15} />, count: h.departments.length },
    { key: 'tree' as const, label: '组织架构', icon: <FolderTree size={15} /> },
    ...(h.canAdmin && h.joinRequests.length > 0 ? [{ key: 'requests' as const, label: '加入申请', icon: <LogIn size={15} />, count: h.joinRequests.length }] : []),
  ]

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>企业管理</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 0 }}>管理企业信息、部门与组织成员</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <ArrowLeftRight size={15} color="#64748b" />
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>我的企业：</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {h.enterprises.map((ent: any) => (
            <button key={ent.id} onClick={() => ent.id !== h.activeId && h.switchEnterprise(ent.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 7, fontSize: 13,
                border: ent.id === h.activeId ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: ent.id === h.activeId ? '#eff6ff' : '#fff',
                color: ent.id === h.activeId ? '#2563eb' : '#334155',
                fontWeight: ent.id === h.activeId ? 600 : 400,
                cursor: ent.id === h.activeId ? 'default' : 'pointer', transition: 'all 0.15s' }}>
              {ent.name}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, marginLeft: 2, color: ent.id === h.activeId ? '#60a5fa' : '#94a3b8' }}>
                {ent.member_role === 'creator' && <Crown size={9} />}
                {ent.member_role === 'admin' && <Shield size={9} />}
                {ent.member_role === 'creator' ? '创建者' : ent.member_role === 'admin' ? '管理员' : '成员'}
              </span>
            </button>
          ))}
          <button onClick={() => { h.setJoinModalOpen(true); h.setJoinSearch(''); h.setJoinResults([]); h.loadMyRequests() }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 7, fontSize: 13,
              border: '1px dashed #94a3b8', background: '#fff', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
            <LogIn size={13} /> 加入企业
          </button>
          {!h.enterprises.some((e: any) => e.member_role === 'creator') && (
            <button onClick={() => h.setCreateModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 7, fontSize: 13,
                border: '1px dashed #94a3b8', background: '#fff', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
              <Plus size={13} /> 创建企业
            </button>
          )}
        </div>
      </div>

      <EnterpriseCard
        ent={h.ent} myRole={h.myRole} isOwner={h.isOwner}
        entMenuOpen={h.entMenuOpen} setEntMenuOpen={h.setEntMenuOpen}
        openEditEnt={h.openEditEnt} handleDeleteEnterprise={h.handleDeleteEnterprise}
      />

      {/* Tab 栏 */}
      <div style={{ display: 'flex', gap: 0, marginTop: 16, borderBottom: '2px solid #e2e8f0' }}>
        {tabItems.map(t => (
          <button key={t.key} onClick={() => h.setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: h.tab === t.key ? '#2563eb' : '#64748b', background: 'transparent',
              borderBottom: h.tab === t.key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2, transition: 'all 0.15s' }}>
            {t.icon} {t.label} {'count' in t && <span style={{ fontSize: 12, color: '#94a3b8' }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {h.tab === 'members' && (
        <MemberList
          members={h.members} departments={h.departments}
          isOwner={h.isOwner} canAdmin={h.canAdmin} getDeptName={h.getDeptName}
          openAddMember={h.openAddMember} openEditMember={h.openEditMember}
          handleDeleteMember={h.handleDeleteMember} handleRoleChange={h.handleRoleChange}
        />
      )}

      {h.tab === 'departments' && (
        <DepartmentList
          departments={h.departments} members={h.members} canAdmin={h.canAdmin}
          deptMenuId={h.deptMenuId} setDeptMenuId={h.setDeptMenuId}
          openAddDept={h.openAddDept} openEditDept={h.openEditDept} handleDeleteDept={h.handleDeleteDept}
        />
      )}

      {h.tab === 'tree' && (
        <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
          <OrgTree ent={h.ent} members={h.members} departments={h.departments} expandedDepts={h.expandedDepts} toggleDept={h.toggleDept} />
        </div>
      )}

      {h.tab === 'requests' && h.canAdmin && (
        <JoinRequests joinRequests={h.joinRequests} handleApprove={h.handleApprove} handleReject={h.handleReject} />
      )}

      {h.isSysAdmin && <AdminAllEnterprises allEnterprises={h.allEnterprises} expandedEntId={h.expandedEntId} setExpandedEntId={h.setExpandedEntId} />}

      <JoinCreateModals
        joinModalOpen={h.joinModalOpen} setJoinModalOpen={h.setJoinModalOpen}
        joinSearch={h.joinSearch} setJoinSearch={h.setJoinSearch}
        joinResults={h.joinResults} joinSearching={h.joinSearching} joining={h.joining}
        myRequests={h.myRequests} handleJoinSearch={h.handleJoinSearch} handleJoin={h.handleJoin}
        createModalOpen={h.createModalOpen} setCreateModalOpen={h.setCreateModalOpen}
        createForm={h.createForm} setCreateForm={h.setCreateForm}
        creating={h.creating} handleCreate={h.handleCreate}
      />

      <EnterpriseModals
        editEntOpen={h.editEntOpen} setEditEntOpen={h.setEditEntOpen}
        entForm={h.entForm} setEntForm={h.setEntForm} entSaving={h.entSaving} handleSaveEnt={h.handleSaveEnt}
        memberModalOpen={h.memberModalOpen} setMemberModalOpen={h.setMemberModalOpen}
        editingMember={h.editingMember} memberForm={h.memberForm} setMemberForm={h.setMemberForm}
        memberSaving={h.memberSaving} handleSaveMember={h.handleSaveMember}
        lookupPhone={h.lookupPhone} setLookupPhone={h.setLookupPhone}
        lookupLoading={h.lookupLoading} handleLookup={h.handleLookup}
        departments={h.departments}
        deptModalOpen={h.deptModalOpen} setDeptModalOpen={h.setDeptModalOpen}
        editingDept={h.editingDept} deptForm={h.deptForm} setDeptForm={h.setDeptForm}
        deptSaving={h.deptSaving} handleSaveDept={h.handleSaveDept}
      />
    </div>
  )
}
