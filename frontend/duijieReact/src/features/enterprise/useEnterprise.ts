import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import { emptyEntForm, emptyMemberForm, emptyDeptForm } from './constants'
import useUserStore from '../../stores/useUserStore'
import { useEnterpriseData, useJoinRequests, useMyJoinRequests, useAllEnterprises, useInvalidate } from '../../hooks/useApi'
import useLiveData from '../../hooks/useLiveData'
import useEnterpriseStore from '../../stores/useEnterpriseStore'
import enterpriseApi from './services/api'

export function useEnterprise() {
  const sysRole = useUserStore(s => s.user?.role) || ''
  const isSysAdmin = sysRole === 'admin'
  const invalidate = useInvalidate()

  // --- React Query data ---
  const { data, isLoading: loading } = useEnterpriseData()
  const { data: joinRequests = [] } = useJoinRequests()
  const { data: myRequests = [] } = useMyJoinRequests()
  const { data: allEnterprises = [] } = useAllEnterprises(isSysAdmin)

  const enterprises = data?.enterprises || []
  const activeId = data?.activeId || null

  // --- UI state ---
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['members', 'departments', 'tree', 'projects', 'roles', 'requests', 'client-requests'] as const
  type TabType = typeof validTabs[number]
  const urlTab = searchParams.get('tab') as TabType
  const [tab, setTabState] = useState<TabType>(validTabs.includes(urlTab as any) ? urlTab! : 'members')
  const setTab = (t: TabType) => { setTabState(t); setSearchParams({ tab: t }, { replace: true }) }
  const [editEntOpen, setEditEntOpen] = useState(false)
  const [entForm, setEntForm] = useState({ ...emptyEntForm })
  const [entSaving, setEntSaving] = useState(false)
  const [createForm, setCreateForm] = useState({ ...emptyEntForm })
  const [creating, setCreating] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinSearch, setJoinSearchValue] = useState('')
  const [joinResults, setJoinResults] = useState<any[]>([])
  const [joinSearching, setJoinSearching] = useState(false)
  const [joining, setJoining] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [memberForm, setMemberForm] = useState({ ...emptyMemberForm })
  const [memberSaving, setMemberSaving] = useState(false)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [deptForm, setDeptForm] = useState({ ...emptyDeptForm })
  const [deptSaving, setDeptSaving] = useState(false)
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set())
  const [deptMenuId, setDeptMenuId] = useState<number | null>(null)
  const [entMenuOpen, setEntMenuOpen] = useState(false)
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [expandedEntId, setExpandedEntId] = useState<number | null>(null)
  const [selectedJoinEnterpriseId, setSelectedJoinEnterpriseId] = useState<number | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeRefreshing, setJoinCodeRefreshing] = useState(false)
  const joinSearchRequestRef = useRef(0)
  const joinSearchTimerRef = useRef<number | null>(null)

  // 响应 URL 参数 action=create/join 自动打开弹窗
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create') {
      setCreateModalOpen(true)
      setSearchParams({}, { replace: true })
    } else if (action === 'join') {
      setJoinModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Invalidate enterprise data + sync global store */
  const refresh = useCallback(() => {
    invalidate('enterprise')
    void useEnterpriseStore.getState().refresh()
  }, [invalidate])

  useLiveData(['enterprise'], refresh)

  // === 企业操作 ===
  const openEditEnt = () => {
    if (!data) return
    const e = data.enterprise
    setEntForm({ name: e.name || '', company: e.company || '', email: e.email || '', phone: e.phone || '', notes: e.notes || '', industry: e.industry || '', scale: e.scale || '', address: e.address || '', credit_code: e.credit_code || '', legal_person: e.legal_person || '', registered_capital: e.registered_capital || '', established_date: e.established_date ? e.established_date.slice(0, 10) : '', business_scope: e.business_scope || '', company_type: e.company_type || '', website: e.website || '' })
    setEditEntOpen(true)
  }
  const handleSaveEnt = async () => {
    if (!entForm.name.trim()) { toast('请输入企业名称', 'error'); return }
    setEntSaving(true)
    const r = await enterpriseApi.update(entForm)
    setEntSaving(false)
    if (r.success) { toast('企业信息已更新', 'success'); setEditEntOpen(false); refresh() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteEnterprise = async () => {
    if (!(await confirm({ message: '确定删除该企业？删除后可重新创建。', danger: true }))) return
    const r = await enterpriseApi.remove()
    if (r.success) { toast('企业已删除', 'success'); refresh() }
    else toast(r.message || '删除失败', 'error')
  }
  const handleCreate = async () => {
    if (!createForm.name.trim()) { toast('请输入企业名称', 'error'); return }
    setCreating(true)
    const r = await enterpriseApi.create(createForm)
    setCreating(false)
    if (r.success) { toast('企业创建成功', 'success'); refresh() }
    else toast(r.message || '创建失败', 'error')
  }

  const openJoinModal = () => {
    setJoinModalOpen(true)
    if (joinSearchTimerRef.current !== null) window.clearTimeout(joinSearchTimerRef.current)
    joinSearchTimerRef.current = null
    setJoinSearchValue('')
    setJoinResults([])
    setJoinSearching(false)
    setSelectedJoinEnterpriseId(null)
    setJoinCode('')
    joinSearchRequestRef.current += 1
    invalidate('enterprise', 'my-requests')
  }

  const clearJoinSearchTimer = () => {
    if (joinSearchTimerRef.current === null) return
    window.clearTimeout(joinSearchTimerRef.current)
    joinSearchTimerRef.current = null
  }

  const updateJoinSearch = (value: string) => {
    setJoinSearchValue(value)
    if (!joinModalOpen) return
    clearJoinSearchTimer()
    const normalizedKeyword = value.trim()
    joinSearchTimerRef.current = window.setTimeout(() => {
      joinSearchTimerRef.current = null
      handleJoinSearch(normalizedKeyword)
    }, normalizedKeyword ? 200 : 0)
  }

  useEffect(() => {
    if (!joinModalOpen) {
      clearJoinSearchTimer()
      return
    }
    updateJoinSearch(joinSearch)
    return clearJoinSearchTimer
  }, [joinModalOpen])

  const handleRegenerateJoinCode = async () => {
    if (!(await confirm({ message: '重置后旧推荐码将立即失效，确认继续？' }))) return
    setJoinCodeRefreshing(true)
    const r = await enterpriseApi.regenerateJoinCode()
    setJoinCodeRefreshing(false)
    if (r.success) {
      toast('企业推荐码已重置', 'success')
      refresh()
    } else {
      toast(r.message || '重置失败', 'error')
    }
  }

  // === 成员操作 ===
  const handleLookup = async () => {
    if (!/^\d{11}$/.test(lookupPhone)) { toast('请输入11位手机号', 'error'); return }
    setLookupLoading(true)
    const r = await enterpriseApi.lookupUser(lookupPhone)
    setLookupLoading(false)
    if (r.success && r.data) {
      setMemberForm(f => ({ ...f, name: r.data.nickname || r.data.username || f.name, phone: r.data.phone || f.phone, email: r.data.email || f.email }))
      toast(`已导入账号: ${r.data.nickname || r.data.username}`, 'success')
    } else {
      toast(r.message || '未找到该手机号对应的账号', 'error')
    }
  }
  const openAddMember = () => {
    setEditingMember(null)
    setLookupPhone('')
    setMemberForm({ ...emptyMemberForm })
    setMemberModalOpen(true)
  }
  const openEditMember = (m: any) => {
    setEditingMember(m)
    setMemberForm({ name: m.name || '', position: m.position || '', department: m.department || '', phone: m.phone || '', email: m.email || '', notes: m.notes || '', employee_id: m.employee_id || '', join_date: m.join_date ? m.join_date.slice(0, 10) : '', supervisor: m.supervisor || '', department_id: m.department_id ? String(m.department_id) : '', enterprise_role_id: m.enterprise_role_id ? String(m.enterprise_role_id) : '' })
    setMemberModalOpen(true)
  }
  const handleSaveMember = async () => {
    if (!memberForm.name.trim()) { toast('请输入成员姓名', 'error'); return }
    setMemberSaving(true)
    const payload = { ...memberForm, department_id: memberForm.department_id ? Number(memberForm.department_id) : null, enterprise_role_id: memberForm.enterprise_role_id ? Number(memberForm.enterprise_role_id) : null }
    const r = editingMember
      ? await enterpriseApi.updateMember(editingMember.id, payload)
      : await enterpriseApi.addMember(payload)
    setMemberSaving(false)
    if (r.success) { toast(editingMember ? '成员已更新' : '成员已添加', 'success'); setMemberModalOpen(false); refresh() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteMember = async (mid: number) => {
    if (!(await confirm({ message: '确定删除此成员？', danger: true }))) return
    const r = await enterpriseApi.removeMember(mid)
    if (r.success) { toast('成员已删除', 'success'); refresh() }
    else toast(r.message || '删除失败', 'error')
  }
  const handleLeaveEnterprise = async () => {
    if (!(await confirm({ message: '确定退出当前企业？退出后将无法访问该企业的项目和数据。', danger: true }))) return
    const r = await enterpriseApi.leaveEnterprise()
    if (r.success) { toast('已退出企业', 'success'); refresh() }
    else toast(r.message || '退出失败', 'error')
  }
  const handleRoleChange = async (memberId: number, role: string) => {
    const r = await enterpriseApi.changeMemberRole(memberId, role)
    if (r.success) { toast('角色已更新', 'success'); refresh() }
    else toast(r.message || '操作失败', 'error')
  }

  // === 部门操作 ===
  const openAddDept = (parentId?: number) => {
    setEditingDept(null)
    setDeptForm({ name: '', parent_id: parentId ? String(parentId) : '' })
    setDeptModalOpen(true)
  }
  const openEditDept = (d: any) => {
    setEditingDept(d)
    setDeptForm({ name: d.name || '', parent_id: d.parent_id ? String(d.parent_id) : '' })
    setDeptModalOpen(true)
  }
  const handleSaveDept = async () => {
    if (!deptForm.name.trim()) { toast('请输入部门名称', 'error'); return }
    setDeptSaving(true)
    const payload = { ...deptForm, parent_id: deptForm.parent_id ? Number(deptForm.parent_id) : null }
    const r = editingDept
      ? await enterpriseApi.updateDepartment(editingDept.id, payload)
      : await enterpriseApi.addDepartment(payload)
    setDeptSaving(false)
    if (r.success) { toast(editingDept ? '部门已更新' : '部门已添加', 'success'); setDeptModalOpen(false); refresh() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteDept = async (did: number) => {
    if (!(await confirm({ message: '删除部门后，该部门下的成员将变为"未分配"状态', danger: true }))) return
    const r = await enterpriseApi.removeDepartment(did)
    if (r.success) { toast('部门已删除', 'success'); refresh() }
    else toast(r.message || '删除失败', 'error')
  }
  const toggleDept = (id: number) => {
    setExpandedDepts(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // === 切换企业 ===
  const switchEnterprise = async (entId: number) => {
    try {
      const ok = await useEnterpriseStore.getState().switchEnterprise(entId)
      if (ok) {
        toast('已切换企业', 'success')
        refresh()
      } else {
        toast('切换失败', 'error')
      }
    } catch {
      toast('切换企业请求失败，请重试', 'error')
    }
  }

  // === 加入企业 ===
  const handleJoinSearch = async (keyword?: string) => {
    const searchText = (keyword ?? joinSearch).trim()
    const requestId = ++joinSearchRequestRef.current
    setJoinSearching(true)
    const r = await enterpriseApi.searchEnterprises(searchText || undefined)
    if (requestId !== joinSearchRequestRef.current) return
    setJoinSearching(false)
    if (r.success) setJoinResults(r.data || [])
    else setJoinResults([])
  }
  const handleJoin = async (entId?: number) => {
    const targetId = entId || selectedJoinEnterpriseId
    const normalizedCode = joinCode.trim().toUpperCase()
    if (!targetId && !normalizedCode) { toast('请先选择企业或输入推荐码', 'error'); return }
    setJoining(true)
    const r = await enterpriseApi.join(targetId, normalizedCode || undefined)
    setJoining(false)
    if (r.success) {
      toast(r.message || '操作成功', 'success')
      setJoinModalOpen(false)
      clearJoinSearchTimer()
      setJoinSearchValue('')
      setJoinResults([])
      setJoinSearching(false)
      setSelectedJoinEnterpriseId(null)
      setJoinCode('')
      joinSearchRequestRef.current += 1
      invalidate('enterprise')
      if (r.data?.joinedDirectly) refresh()
    } else {
      toast(r.message || '申请失败', 'error')
    }
  }

  // === 审批 ===
  const handleApprove = async (id: number) => {
    const r = await enterpriseApi.approveJoinRequest(id)
    if (r.success) { toast('已批准', 'success'); invalidate('enterprise', 'join-requests'); refresh() }
    else toast(r.message || '操作失败', 'error')
  }
  const handleReject = async (id: number) => {
    const r = await enterpriseApi.rejectJoinRequest(id)
    if (r.success) { toast('已拒绝', 'success'); invalidate('enterprise', 'join-requests') }
    else toast(r.message || '操作失败', 'error')
  }

  // === 角色操作 ===
  const handleCreateRole = async (form: any) => {
    const r = await enterpriseApi.createRole(form)
    if (r.success) { toast('角色已创建', 'success'); refresh() }
    else toast(r.message || '创建失败', 'error')
  }
  const handleUpdateRole = async (id: number, form: any) => {
    const r = await enterpriseApi.updateRole(id, form)
    if (r.success) { toast('角色已更新', 'success'); refresh() }
    else toast(r.message || '更新失败', 'error')
  }
  const handleDeleteRole = async (id: number) => {
    if (!(await confirm({ message: '确定删除该角色？', danger: true }))) return
    const r = await enterpriseApi.removeRole(id)
    if (r.success) { toast('角色已删除', 'success'); refresh() }
    else toast(r.message || '删除失败', 'error')
  }
  const handleAssignRole = async (memberId: number, roleId: number | null) => {
    const r = await enterpriseApi.assignRole(memberId, roleId)
    if (r.success) { toast('角色已分配', 'success'); refresh() }
    else toast(r.message || '操作失败', 'error')
  }
  const inlineCreateRole = async (form: any): Promise<number | null> => {
    const r = await enterpriseApi.createRole(form)
    if (r.success) { toast(`角色「${form.name}」已创建`, 'success'); refresh(); return r.data?.id || null }
    else { toast(r.message || '创建失败', 'error'); return null }
  }

  // 派生数据
  const ent = data?.enterprise
  const members = data?.members || []
  const departments = data?.departments || []
  const roles = data?.roles || []
  const enterprisePerms = data?.enterprisePerms || {}
  const myRole = ent?.member_role || 'member'
  const isOwner = myRole === 'creator'
  const canAdmin = isOwner || !!enterprisePerms.can_manage_members
  const canManageRoles = isOwner || !!enterprisePerms.can_manage_roles
  const canManageDept = isOwner || !!enterprisePerms.can_manage_department
  const canEditEnterprise = isOwner || !!enterprisePerms.can_edit_enterprise
  const getDeptName = (id: number | null) => departments.find((d: any) => d.id === id)?.name || ''
  const getRoleName = (roleId: number | null) => roles.find((r: any) => r.id === roleId)?.name || ''
  const getRoleColor = (roleId: number | null) => roles.find((r: any) => r.id === roleId)?.color || '#64748b'

  // 同步企业权限到 userStore

  return {
    // 状态
    data, loading, tab, setTab, isSysAdmin, enterprises, activeId, switchEnterprise,
    ent, members, departments, roles, enterprisePerms, myRole, isOwner, canAdmin, canManageRoles, canManageDept, canEditEnterprise, getDeptName, getRoleName, getRoleColor,
    // 企业
    editEntOpen, setEditEntOpen, entForm, setEntForm, entSaving, entMenuOpen, setEntMenuOpen,
    openEditEnt, handleSaveEnt, handleDeleteEnterprise, handleRegenerateJoinCode, joinCodeRefreshing,
    createModalOpen, setCreateModalOpen, createForm, setCreateForm, creating, handleCreate,
    // 加入
    joinModalOpen, setJoinModalOpen, openJoinModal, joinSearch, setJoinSearch: updateJoinSearch, joinResults, setJoinResults, joinSearching, joining,
    selectedJoinEnterpriseId, setSelectedJoinEnterpriseId, joinCode, setJoinCode,
    myRequests, handleJoinSearch, handleJoin,
    // 成员
    memberModalOpen, setMemberModalOpen, editingMember, memberForm, setMemberForm, memberSaving,
    lookupPhone, setLookupPhone, lookupLoading,
    openAddMember, openEditMember, handleSaveMember, handleDeleteMember, handleRoleChange, handleLookup, handleLeaveEnterprise,
    // 角色
    handleCreateRole, handleUpdateRole, handleDeleteRole, handleAssignRole, inlineCreateRole,
    // 部门
    deptModalOpen, setDeptModalOpen, editingDept, deptForm, setDeptForm, deptSaving, deptMenuId, setDeptMenuId,
    openAddDept, openEditDept, handleSaveDept, handleDeleteDept,
    expandedDepts, toggleDept,
    // 审批
    joinRequests, handleApprove, handleReject,
    // 系统管理员
    allEnterprises, expandedEntId, setExpandedEntId,
  }
}
