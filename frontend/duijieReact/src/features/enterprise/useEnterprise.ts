import { useState, useEffect, useRef } from 'react'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import { emptyEntForm, emptyMemberForm, emptyDeptForm } from './constants'
import useUserStore from '../../stores/useUserStore'

export function useEnterprise() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enterprises, setEnterprises] = useState<any[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [tab, setTab] = useState<'members' | 'departments' | 'tree' | 'projects' | 'roles' | 'requests'>('members')
  const [editEntOpen, setEditEntOpen] = useState(false)
  const [entForm, setEntForm] = useState({ ...emptyEntForm })
  const [entSaving, setEntSaving] = useState(false)
  const [createForm, setCreateForm] = useState({ ...emptyEntForm })
  const [creating, setCreating] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinSearch, setJoinSearch] = useState('')
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
  const [allEnterprises, setAllEnterprises] = useState<any[]>([])
  const [expandedEntId, setExpandedEntId] = useState<number | null>(null)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [recommendedEnterprises, setRecommendedEnterprises] = useState<any[]>([])
  const [selectedJoinEnterpriseId, setSelectedJoinEnterpriseId] = useState<number | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeRefreshing, setJoinCodeRefreshing] = useState(false)
  const joinSearchRequestRef = useRef(0)

  const sysRole = useUserStore(s => s.user?.role) || ''
  const isSysAdmin = sysRole === 'admin'

  const load = () => {
    fetchApi('/api/my-enterprise').then(r => {
      if (r.success) {
        setData(r.data)
        setEnterprises(r.data?.enterprises || [])
        setActiveId(r.data?.activeId || null)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  const loadAllEnterprises = () => {
    if (!isSysAdmin) return
    fetchApi('/api/my-enterprise/all').then(r => { if (r.success) setAllEnterprises(r.data || []) })
  }
  const loadJoinRequests = async () => {
    const r = await fetchApi('/api/my-enterprise/join-requests')
    if (r.success) setJoinRequests(r.data || [])
  }
  const loadMyRequests = async () => {
    const r = await fetchApi('/api/my-enterprise/my-requests')
    if (r.success) setMyRequests(r.data || [])
  }
  const loadRecommendedEnterprises = async () => {
    const r = await fetchApi('/api/my-enterprise/recommended')
    if (r.success) setRecommendedEnterprises(r.data || [])
  }

  useEffect(() => { load(); loadAllEnterprises(); loadMyRequests() }, [])
  useEffect(() => {
    const role = data?.enterprise?.member_role
    const canManageMembers = !!data?.enterprisePerms?.can_manage_members
    if (role === 'creator' || role === 'admin' || canManageMembers) loadJoinRequests()
  }, [data])

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
    const r = await fetchApi('/api/my-enterprise', { method: 'PUT', body: JSON.stringify(entForm) })
    setEntSaving(false)
    if (r.success) { toast('企业信息已更新', 'success'); setEditEntOpen(false); load() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteEnterprise = async () => {
    if (!(await confirm({ message: '确定删除该企业？删除后可重新创建。', danger: true }))) return
    const r = await fetchApi('/api/my-enterprise', { method: 'DELETE' })
    if (r.success) { toast('企业已删除', 'success'); setData(null) }
    else toast(r.message || '删除失败', 'error')
  }
  const handleCreate = async () => {
    if (!createForm.name.trim()) { toast('请输入企业名称', 'error'); return }
    setCreating(true)
    const r = await fetchApi('/api/my-enterprise', { method: 'POST', body: JSON.stringify(createForm) })
    setCreating(false)
    if (r.success) { toast('企业创建成功', 'success'); load() }
    else toast(r.message || '创建失败', 'error')
  }

  const openJoinModal = () => {
    setJoinModalOpen(true)
    setJoinSearch('')
    setJoinResults([])
    setJoinSearching(false)
    setSelectedJoinEnterpriseId(null)
    setJoinCode('')
    joinSearchRequestRef.current += 1
    loadMyRequests()
    loadRecommendedEnterprises()
  }

  useEffect(() => {
    if (!joinModalOpen) return
    const keyword = joinSearch.trim()
    const timer = window.setTimeout(() => {
      handleJoinSearch(keyword)
    }, keyword ? 200 : 0)
    return () => window.clearTimeout(timer)
  }, [joinSearch, joinModalOpen])

  const handleRegenerateJoinCode = async () => {
    if (!(await confirm({ message: '重置后旧推荐码将立即失效，确认继续？' }))) return
    setJoinCodeRefreshing(true)
    const r = await fetchApi('/api/my-enterprise/join-code/regenerate', { method: 'POST' })
    setJoinCodeRefreshing(false)
    if (r.success) {
      toast('企业推荐码已重置', 'success')
      load()
    } else {
      toast(r.message || '重置失败', 'error')
    }
  }

  // === 成员操作 ===
  const handleLookup = async () => {
    if (!/^\d{11}$/.test(lookupPhone)) { toast('请输入11位手机号', 'error'); return }
    setLookupLoading(true)
    const r = await fetchApi(`/api/my-enterprise/lookup-user?phone=${lookupPhone}`)
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
      ? await fetchApi(`/api/my-enterprise/members/${editingMember.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await fetchApi('/api/my-enterprise/members', { method: 'POST', body: JSON.stringify(payload) })
    setMemberSaving(false)
    if (r.success) { toast(editingMember ? '成员已更新' : '成员已添加', 'success'); setMemberModalOpen(false); load() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteMember = async (mid: number) => {
    if (!(await confirm({ message: '确定删除此成员？', danger: true }))) return
    const r = await fetchApi(`/api/my-enterprise/members/${mid}`, { method: 'DELETE' })
    if (r.success) { toast('成员已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }
  const handleRoleChange = async (memberId: number, role: string) => {
    const r = await fetchApi(`/api/my-enterprise/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify({ role }) })
    if (r.success) { toast('角色已更新', 'success'); load() }
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
      ? await fetchApi(`/api/my-enterprise/departments/${editingDept.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await fetchApi('/api/my-enterprise/departments', { method: 'POST', body: JSON.stringify(payload) })
    setDeptSaving(false)
    if (r.success) { toast(editingDept ? '部门已更新' : '部门已添加', 'success'); setDeptModalOpen(false); load() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteDept = async (did: number) => {
    if (!(await confirm({ message: '删除部门后，该部门下的成员将变为"未分配"状态', danger: true }))) return
    const r = await fetchApi(`/api/my-enterprise/departments/${did}`, { method: 'DELETE' })
    if (r.success) { toast('部门已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }
  const toggleDept = (id: number) => {
    setExpandedDepts(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // === 切换企业 ===
  const switchEnterprise = async (entId: number) => {
    try {
      const r = await fetchApi('/api/my-enterprise/switch', { method: 'PUT', body: JSON.stringify({ enterprise_id: entId }) })
      if (r.success) {
        toast('已切换企业', 'success')
        setActiveId(entId)
        await new Promise(resolve => setTimeout(resolve, 200))
        load()
      } else {
        toast(r.message || '切换失败', 'error')
      }
    } catch (e) {
      toast('切换企业请求失败，请重试', 'error')
    }
  }

  // === 加入企业 ===
  const handleJoinSearch = async (keyword?: string) => {
    const searchText = (keyword ?? joinSearch).trim()
    const requestId = ++joinSearchRequestRef.current
    setJoinSearching(true)
    const query = searchText ? `?name=${encodeURIComponent(searchText)}` : ''
    const r = await fetchApi(`/api/my-enterprise/search${query}`)
    if (requestId !== joinSearchRequestRef.current) return
    setJoinSearching(false)
    if (r.success) setJoinResults(r.data || [])
    else setJoinResults([])
  }
  const handleJoin = async (entId?: number) => {
    const targetId = entId || selectedJoinEnterpriseId
    if (!targetId) { toast('请先选择企业', 'error'); return }
    setJoining(true)
    const payload: Record<string, any> = { enterprise_id: targetId }
    const normalizedCode = joinCode.trim().toUpperCase()
    if (normalizedCode) payload.join_code = normalizedCode
    const r = await fetchApi('/api/my-enterprise/join', { method: 'POST', body: JSON.stringify(payload) })
    setJoining(false)
    if (r.success) {
      toast(r.message || '操作成功', 'success')
      setJoinModalOpen(false)
      setJoinSearch('')
      setJoinResults([])
      setJoinSearching(false)
      setSelectedJoinEnterpriseId(null)
      setJoinCode('')
      joinSearchRequestRef.current += 1
      loadMyRequests()
      if (r.data?.joinedDirectly) load()
    } else {
      toast(r.message || '申请失败', 'error')
    }
  }

  // === 审批 ===
  const handleApprove = async (id: number) => {
    const r = await fetchApi(`/api/my-enterprise/join-requests/${id}/approve`, { method: 'POST' })
    if (r.success) { toast('已批准', 'success'); loadJoinRequests(); load() }
    else toast(r.message || '操作失败', 'error')
  }
  const handleReject = async (id: number) => {
    const r = await fetchApi(`/api/my-enterprise/join-requests/${id}/reject`, { method: 'POST' })
    if (r.success) { toast('已拒绝', 'success'); loadJoinRequests() }
    else toast(r.message || '操作失败', 'error')
  }

  // === 角色操作 ===
  const handleCreateRole = async (form: any) => {
    const r = await fetchApi('/api/my-enterprise/roles', { method: 'POST', body: JSON.stringify(form) })
    if (r.success) { toast('角色已创建', 'success'); load() }
    else toast(r.message || '创建失败', 'error')
  }
  const handleUpdateRole = async (id: number, form: any) => {
    const r = await fetchApi(`/api/my-enterprise/roles/${id}`, { method: 'PUT', body: JSON.stringify(form) })
    if (r.success) { toast('角色已更新', 'success'); load() }
    else toast(r.message || '更新失败', 'error')
  }
  const handleDeleteRole = async (id: number) => {
    if (!(await confirm({ message: '确定删除该角色？', danger: true }))) return
    const r = await fetchApi(`/api/my-enterprise/roles/${id}`, { method: 'DELETE' })
    if (r.success) { toast('角色已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }
  const handleAssignRole = async (memberId: number, roleId: number | null) => {
    const r = await fetchApi(`/api/my-enterprise/members/${memberId}/assign-role`, { method: 'PUT', body: JSON.stringify({ enterprise_role_id: roleId }) })
    if (r.success) { toast('角色已分配', 'success'); load() }
    else toast(r.message || '操作失败', 'error')
  }
  const inlineCreateRole = async (form: any): Promise<number | null> => {
    const r = await fetchApi('/api/my-enterprise/roles', { method: 'POST', body: JSON.stringify(form) })
    if (r.success) { toast(`角色「${form.name}」已创建`, 'success'); await load(); return r.data?.id || null }
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
  const getDeptName = (id: number | null) => departments.find((d: any) => d.id === id)?.name || ''
  const getRoleName = (roleId: number | null) => roles.find((r: any) => r.id === roleId)?.name || ''
  const getRoleColor = (roleId: number | null) => roles.find((r: any) => r.id === roleId)?.color || '#64748b'

  // 同步企业权限到 userStore

  return {
    // 状态
    data, loading, tab, setTab, isSysAdmin, enterprises, activeId, switchEnterprise,
    ent, members, departments, roles, enterprisePerms, myRole, isOwner, canAdmin, canManageRoles, getDeptName, getRoleName, getRoleColor,
    // 企业
    editEntOpen, setEditEntOpen, entForm, setEntForm, entSaving, entMenuOpen, setEntMenuOpen,
    openEditEnt, handleSaveEnt, handleDeleteEnterprise, handleRegenerateJoinCode, joinCodeRefreshing,
    createModalOpen, setCreateModalOpen, createForm, setCreateForm, creating, handleCreate,
    // 加入
    joinModalOpen, setJoinModalOpen, openJoinModal, joinSearch, setJoinSearch, joinResults, setJoinResults, joinSearching, joining,
    recommendedEnterprises, selectedJoinEnterpriseId, setSelectedJoinEnterpriseId, joinCode, setJoinCode,
    myRequests, loadMyRequests, handleJoinSearch, handleJoin,
    // 成员
    memberModalOpen, setMemberModalOpen, editingMember, memberForm, setMemberForm, memberSaving,
    lookupPhone, setLookupPhone, lookupLoading,
    openAddMember, openEditMember, handleSaveMember, handleDeleteMember, handleRoleChange, handleLookup,
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
