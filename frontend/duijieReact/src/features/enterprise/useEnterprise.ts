import { useState, useEffect } from 'react'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import { emptyEntForm, emptyMemberForm, emptyDeptForm } from './constants'
import useUserStore from '../../stores/useUserStore'

export function useEnterprise() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'members' | 'departments' | 'tree' | 'requests'>('members')
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

  const sysRole = useUserStore(s => s.user?.role) || ''
  const isSysAdmin = sysRole === 'admin'

  const load = () => {
    fetchApi('/api/my-enterprise').then(r => {
      if (r.success) setData(r.data)
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

  useEffect(() => { load(); loadAllEnterprises() }, [])
  useEffect(() => { const r = data?.enterprise?.member_role; if (r === 'creator' || r === 'admin') loadJoinRequests() }, [data])

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
    setMemberForm({ name: m.name || '', position: m.position || '', department: m.department || '', phone: m.phone || '', email: m.email || '', notes: m.notes || '', employee_id: m.employee_id || '', join_date: m.join_date ? m.join_date.slice(0, 10) : '', supervisor: m.supervisor || '', department_id: m.department_id ? String(m.department_id) : '' })
    setMemberModalOpen(true)
  }
  const handleSaveMember = async () => {
    if (!memberForm.name.trim()) { toast('请输入成员姓名', 'error'); return }
    setMemberSaving(true)
    const payload = { ...memberForm, department_id: memberForm.department_id ? Number(memberForm.department_id) : null }
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

  // === 加入企业 ===
  const handleJoinSearch = async () => {
    if (!joinSearch.trim()) return
    setJoinSearching(true)
    const r = await fetchApi(`/api/my-enterprise/search?name=${encodeURIComponent(joinSearch.trim())}`)
    setJoinSearching(false)
    if (r.success) setJoinResults(r.data || [])
  }
  const handleJoin = async (entId: number) => {
    setJoining(true)
    const r = await fetchApi('/api/my-enterprise/join', { method: 'POST', body: JSON.stringify({ enterprise_id: entId }) })
    setJoining(false)
    if (r.success) { toast(r.message || '已提交申请', 'success'); loadMyRequests() }
    else toast(r.message || '申请失败', 'error')
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

  // 派生数据
  const ent = data?.enterprise
  const members = data?.members || []
  const departments = data?.departments || []
  const myRole = ent?.member_role || 'member'
  const isOwner = myRole === 'creator'
  const canAdmin = myRole === 'creator' || myRole === 'admin'
  const getDeptName = (id: number | null) => departments.find((d: any) => d.id === id)?.name || ''

  return {
    // 状态
    data, loading, tab, setTab, isSysAdmin,
    ent, members, departments, myRole, isOwner, canAdmin, getDeptName,
    // 企业
    editEntOpen, setEditEntOpen, entForm, setEntForm, entSaving, entMenuOpen, setEntMenuOpen,
    openEditEnt, handleSaveEnt, handleDeleteEnterprise,
    createModalOpen, setCreateModalOpen, createForm, setCreateForm, creating, handleCreate,
    // 加入
    joinModalOpen, setJoinModalOpen, joinSearch, setJoinSearch, joinResults, setJoinResults, joinSearching, joining,
    myRequests, loadMyRequests, handleJoinSearch, handleJoin,
    // 成员
    memberModalOpen, setMemberModalOpen, editingMember, memberForm, setMemberForm, memberSaving,
    lookupPhone, setLookupPhone, lookupLoading,
    openAddMember, openEditMember, handleSaveMember, handleDeleteMember, handleRoleChange, handleLookup,
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
