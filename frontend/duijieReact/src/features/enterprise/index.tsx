import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, Building, FolderTree, LogIn, KeyRound, FolderKanban, UserPlus } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useEnterprise } from './useEnterprise'
import { section } from './constants'
import EmptyState from './EmptyState'
import EnterpriseCard from './EnterpriseCard'
import MemberList from './MemberList'
import DepartmentList from './DepartmentList'
import OrgTree from './OrgTree'
import JoinRequests from './JoinRequests'
import EnterpriseRoleTab from './EnterpriseRoleTab'
import EnterpriseProjects from './EnterpriseProjects'
import ClientRequests from './ClientRequests'
import AdminAllEnterprises from './AdminAllEnterprises'
import EnterpriseModals from './EnterpriseModals'
import JoinCreateModals from './JoinCreateModals'

export default function Enterprise() {
  const h = useEnterprise()
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()
  const [pendingRequestCount, setPendingRequestCount] = useState(0)

  useEffect(() => {
    if (!h.data) return
    Promise.all([
      fetchApi('/api/projects/client-requests'),
      fetchApi('/api/client-requests/incoming'),
    ]).then(([pRes, cRes]) => {
      const pCount = (pRes.data || []).filter((r: any) => r.status === 'pending').length
      const cCount = (cRes.data || []).filter((r: any) => r.status === 'pending').length
      setPendingRequestCount(pCount + cCount)
    })
  }, [h.data, h.tab])

  if (h.loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>

  if (!h.data) return (
    <EmptyState
      createModalOpen={h.createModalOpen} setCreateModalOpen={h.setCreateModalOpen}
      createForm={h.createForm} setCreateForm={h.setCreateForm}
      creating={h.creating} handleCreate={h.handleCreate}
      joinModalOpen={h.joinModalOpen} setJoinModalOpen={h.setJoinModalOpen} openJoinModal={h.openJoinModal}
      joinSearch={h.joinSearch} setJoinSearch={h.setJoinSearch}
      joinResults={h.joinResults}
      joinSearching={h.joinSearching} joining={h.joining}
      selectedJoinEnterpriseId={h.selectedJoinEnterpriseId} setSelectedJoinEnterpriseId={h.setSelectedJoinEnterpriseId}
      joinCode={h.joinCode} setJoinCode={h.setJoinCode}
      myRequests={h.myRequests}
      handleJoinSearch={h.handleJoinSearch} handleJoin={h.handleJoin}
      isSysAdmin={h.isSysAdmin} allEnterprises={h.allEnterprises}
      expandedEntId={h.expandedEntId} setExpandedEntId={h.setExpandedEntId}
    />
  )

  const tabItems = [
    { key: 'members' as const, label: '组织成员', icon: <Users size={15} />, count: h.members.length },
    { key: 'departments' as const, label: '部门管理', icon: <Building size={15} />, count: h.departments.length },
    { key: 'tree' as const, label: '组织架构', icon: <FolderTree size={15} /> },
    { key: 'projects' as const, label: '企业项目', icon: <FolderKanban size={15} /> },
    ...((h.isOwner || h.canManageRoles) ? [{ key: 'roles' as const, label: '角色管理', icon: <KeyRound size={15} />, count: h.roles.length }] : []),
    { key: 'client-requests' as const, label: '客户请求', icon: <UserPlus size={15} />, badge: pendingRequestCount },
    ...(h.canAdmin && h.joinRequests.length > 0 ? [{ key: 'requests' as const, label: '加入申请', icon: <LogIn size={15} />, count: h.joinRequests.length }] : []),
  ]

  return (
    <div>
      <div style={{
        textAlign: isMobile ? 'center' : undefined, marginBottom: isMobile ? 12 : 0,
        ...(isMobile ? { position: 'sticky', top: -20, zIndex: 10, background: 'var(--bg-secondary)', margin: '-20px -16px 12px', padding: '16px 16px 10px' } : {}),
      }}>
        <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>企业管理</h1>
        {!isMobile && <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 20, marginTop: 0 }}>管理企业信息、部门与组织成员</p>}
      </div>

      {/* Tab 栏 */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-primary)', marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' }}>
        {tabItems.map(t => (
          <button key={t.key} onClick={() => h.setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: isMobile ? '8px 12px' : '10px 20px', border: 'none', cursor: 'pointer', fontSize: isMobile ? 13 : 14, fontWeight: 600,
              color: h.tab === t.key ? 'var(--brand)' : 'var(--text-secondary)', background: 'transparent',
              borderBottom: h.tab === t.key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2, transition: 'all 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0 }}>
            {!isMobile && t.icon} {t.label} {'count' in t && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({t.count})</span>}
            {'badge' in t && (t as any).badge > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', lineHeight: 1 }}>{(t as any).badge}</span>}
          </button>
        ))}
      </div>

      <EnterpriseCard
        ent={h.ent} myRole={h.myRole} isOwner={h.isOwner} canAdmin={h.canAdmin} canEditEnterprise={h.canEditEnterprise}
        entMenuOpen={h.entMenuOpen} setEntMenuOpen={h.setEntMenuOpen}
        openEditEnt={h.openEditEnt} handleDeleteEnterprise={h.handleDeleteEnterprise}
        handleLeaveEnterprise={h.handleLeaveEnterprise}
        joinCodeRefreshing={h.joinCodeRefreshing} handleRegenerateJoinCode={h.handleRegenerateJoinCode}
      />

      {h.tab === 'members' && (
        <MemberList
          members={h.members} departments={h.departments} roles={h.roles}
          isOwner={h.isOwner} canAdmin={h.canAdmin} getDeptName={h.getDeptName}
          getRoleName={h.getRoleName} getRoleColor={h.getRoleColor}
          openAddMember={h.openAddMember} openEditMember={h.openEditMember}
          handleDeleteMember={h.handleDeleteMember} handleRoleChange={h.handleRoleChange}
        />
      )}

      {h.tab === 'projects' && <EnterpriseProjects />}

      {h.tab === 'roles' && (
        <EnterpriseRoleTab
          roles={h.roles} isOwner={h.isOwner} canManageRoles={h.canManageRoles}
          onCreateRole={h.handleCreateRole} onUpdateRole={h.handleUpdateRole} onDeleteRole={h.handleDeleteRole}
        />
      )}

      {h.tab === 'departments' && (
        <DepartmentList
          departments={h.departments} members={h.members} canAdmin={h.canManageDept}
          deptMenuId={h.deptMenuId} setDeptMenuId={h.setDeptMenuId}
          openAddDept={h.openAddDept} openEditDept={h.openEditDept} handleDeleteDept={h.handleDeleteDept}
        />
      )}

      {h.tab === 'tree' && (
        <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
          <OrgTree ent={h.ent} members={h.members} departments={h.departments} expandedDepts={h.expandedDepts} toggleDept={h.toggleDept} />
        </div>
      )}

      {h.tab === 'client-requests' && (
        <ClientRequests canAdmin={h.canAdmin} onRefresh={() => {
          Promise.all([
            fetchApi('/api/projects/client-requests'),
            fetchApi('/api/client-requests/incoming'),
          ]).then(([pRes, cRes]) => {
            const pCount = (pRes.data || []).filter((r: any) => r.status === 'pending').length
            const cCount = (cRes.data || []).filter((r: any) => r.status === 'pending').length
            setPendingRequestCount(pCount + cCount)
          })
        }} />
      )}

      {h.tab === 'requests' && h.canAdmin && (
        <JoinRequests joinRequests={h.joinRequests} handleApprove={h.handleApprove} handleReject={h.handleReject} />
      )}

      {h.isSysAdmin && <AdminAllEnterprises allEnterprises={h.allEnterprises} expandedEntId={h.expandedEntId} setExpandedEntId={h.setExpandedEntId} />}

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

      <EnterpriseModals
        editEntOpen={h.editEntOpen} setEditEntOpen={h.setEditEntOpen}
        entForm={h.entForm} setEntForm={h.setEntForm} entSaving={h.entSaving} handleSaveEnt={h.handleSaveEnt}
        memberModalOpen={h.memberModalOpen} setMemberModalOpen={h.setMemberModalOpen}
        editingMember={h.editingMember} memberForm={h.memberForm} setMemberForm={h.setMemberForm}
        memberSaving={h.memberSaving} handleSaveMember={h.handleSaveMember}
        lookupPhone={h.lookupPhone} setLookupPhone={h.setLookupPhone}
        lookupLoading={h.lookupLoading} handleLookup={h.handleLookup}
        departments={h.departments} roles={h.roles} onCreateRole={h.inlineCreateRole}
        deptModalOpen={h.deptModalOpen} setDeptModalOpen={h.setDeptModalOpen}
        editingDept={h.editingDept} deptForm={h.deptForm} setDeptForm={h.setDeptForm}
        deptSaving={h.deptSaving} handleSaveDept={h.handleSaveDept}
      />
    </div>
  )
}
