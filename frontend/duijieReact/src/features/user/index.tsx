import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit2, Shield, User, Power, Link2, Clock, CheckCircle2, KeyRound, Download, Users, MoreVertical } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useUsers, useInvalidate } from '../../hooks/useApi'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import useIsMobile from '../ui/useIsMobile'
import PageHeader from '../ui/PageHeader'
import StatsCards from '../ui/StatsCards'
import FilterBar from '../ui/FilterBar'
import BatchActionBar from '../ui/BatchActionBar'
import EmptyState from '../ui/EmptyState'
import DataTable from '../ui/DataTable'
import { SkeletonTable } from '../ui/Skeleton'
import UserDetailSheet from './components/UserDetailSheet'
import UserFormModal from './components/UserFormModal'
import InviteLinkSection from './components/InviteLinkSection'
import { roleMap, statusMap, fmtDate, getStatusInfo } from './constants'

const PAGE_SIZE = 10

const maskPhone = (p: string) => p ? p.replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : ''
const maskEmail = (e: string) => e ? e.replace(/(.{2}).+(@.+)/, '$1***$2') : ''

export default function UserManagement() {
  const isMobile = useIsMobile()
  const { data: users = [], isLoading: loading } = useUsers()
  const invalidate = useInvalidate()
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [detailUser, setDetailUser] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const load = () => invalidate('users')

  const filtered = useMemo(() => {
    return users.filter((u: any) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter === 'active' && u.is_active !== 1) return false
      if (statusFilter === 'pending' && u.is_active !== 0) return false
      if (statusFilter === 'disabled' && u.is_active !== 2) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return (u.username || '').toLowerCase().includes(q) || (u.nickname || '').toLowerCase().includes(q) || (u.phone || '').includes(q) || (u.email || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [users, roleFilter, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, roleFilter, statusFilter])

  const openEdit = (u: any) => { setEditUser(u); setShowEdit(true) }

  const handleDelete = async (u: any) => {
    if (!(await confirm({ message: `确定删除账号 "${u.nickname || u.username}"？此操作不可恢复。`, danger: true }))) return
    try {
      const r = await fetchApi(`/api/users/${u.id}`, { method: 'DELETE' })
      if (r.success) { toast('已删除', 'success'); load() }
      else toast(r.message || '删除失败', 'error')
    } catch { toast('网络错误', 'error') }
  }

  const handleResetPwd = async (u: any) => {
    if (!(await confirm({ message: `确定重置「${u.nickname || u.username}」的密码为 123456？`, danger: true }))) return
    try {
      const r = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ password: '123456' }) })
      if (r.success) toast('密码已重置为 123456', 'success')
      else toast(r.message || '操作失败', 'error')
    } catch { toast('网络错误', 'error') }
  }

  const handleToggleStatus = async (u: any) => {
    const active = u.is_active === 1
    const label = active ? '禁用' : '启用'
    if (!(await confirm({ message: `确定${label}账号「${u.nickname || u.username}」？`, danger: active }))) return
    try {
      const r = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: active ? 2 : 1 }) })
      if (r.success) { toast(`已${label}`, 'success'); load() }
      else toast(r.message || '操作失败', 'error')
    } catch { toast('网络错误', 'error') }
  }

  const handleApprove = async (u: any) => {
    try {
      const r = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: 1 }) })
      if (r.success) { toast('已审批激活', 'success'); load() }
      else toast(r.message || '操作失败', 'error')
    } catch { toast('网络错误', 'error') }
  }

  const handleBatchToggle = async (activate: boolean) => {
    const label = activate ? '启用' : '禁用'
    if (!(await confirm({ message: `确定批量${label} ${selected.length} 个账号？`, danger: !activate }))) return
    const results = await Promise.all(selected.map(uid => fetchApi(`/api/users/${uid}`, { method: 'PUT', body: JSON.stringify({ is_active: activate ? 1 : 2 }) })))
    const failedCount = results.filter(r => !r.success).length
    if (failedCount === 0) toast(`已批量${label} ${selected.length} 个账号`, 'success')
    else toast(`${failedCount} 个账号${label}失败`, 'error')
    setSelected([])
    load()
  }

  const handleExport = () => {
    const header = ['ID,用户名,昵称,角色,状态,手机,邮箱,注册时间,最近登录']
    const rows = filtered.map(u => {
      const st = statusMap[u.is_active as number] || statusMap[1]
      return `${u.display_id || u.id},${u.username},${u.nickname || ''},${roleMap[u.role]?.label || u.role},${st.label},${u.phone || ''},${u.email || ''},${fmtDate(u.created_at)},${fmtDate(u.last_login_at)}`
    })
    const csv = '\uFEFF' + header.concat(rows).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = `用户列表_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('导出成功', 'success')
  }

  const toggleSelect = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAll = () => setSelected(prev => {
    const pageIds = paged.map(u => u.id)
    const hasAll = pageIds.length > 0 && pageIds.every(id => prev.includes(id))
    if (hasAll) return prev.filter(id => !pageIds.includes(id))
    return Array.from(new Set([...prev, ...pageIds]))
  })

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const statCounts = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active === 1).length,
    pending: users.filter(u => u.is_active === 0).length,
    admin: users.filter(u => u.role === 'admin').length,
    disabled: users.filter(u => u.is_active === 2).length,
    member: users.filter(u => u.role === 'member').length,
  }), [users])

  const overviewCards = [
    { label: '总账号', value: statCounts.total, hint: '平台内全部账号', color: 'var(--text-heading)', icon: Users, tone: 'rgba(15,23,42,0.05)' },
    { label: '管理员', value: statCounts.admin, hint: '高权限账号', color: 'var(--color-danger)', icon: Shield, tone: 'rgba(239,68,68,0.12)' },
    { label: '成员', value: statCounts.member, hint: '普通平台成员', color: 'var(--brand)', icon: User, tone: 'rgba(59,130,246,0.12)' },
    { label: '已启用', value: statCounts.active, hint: '当前可正常登录', color: 'var(--color-success)', icon: CheckCircle2, tone: 'rgba(34,197,94,0.12)' },
    { label: '待审批', value: statCounts.pending, hint: '等待管理员处理', color: 'var(--color-warning)', icon: Clock, tone: 'rgba(245,158,11,0.12)' },
    { label: '已禁用', value: statCounts.disabled, hint: '当前不可登录', color: 'var(--text-secondary)', icon: Power, tone: 'rgba(100,116,139,0.12)' },
  ]

  const hasFilters = !!search.trim() || roleFilter !== 'all' || statusFilter !== 'all'
  const activeFilterCount = [search.trim(), roleFilter !== 'all' ? roleFilter : '', statusFilter !== 'all' ? statusFilter : ''].filter(Boolean).length
  const selectedCount = selected.length
  const pageIds = paged.map(u => u.id)
  const hasAllOnPage = pageIds.length > 0 && pageIds.every(id => selected.includes(id))
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const someSelected = selectedSet.size > 0 && !hasAllOnPage

  const tableColumns = useMemo(() => [
    {
      key: 'user', title: '用户',
      render: (u: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setDetailUser(u)}>
          <Avatar name={u.nickname || u.username} size={34} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', lineHeight: 1.3 }}>{u.nickname || u.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{u.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact', title: '联系方式',
      render: (u: any) => (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{u.phone ? maskPhone(u.phone) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{u.email ? maskEmail(u.email) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}</div>
        </div>
      ),
    },
    {
      key: 'role', title: '角色',
      render: (u: any) => {
        const ri = roleMap[u.role] || roleMap.member
        const RIcon = ri.icon
        return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: ri.bg, color: ri.color, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}><RIcon size={10} /> {ri.label}</span>
      },
    },
    {
      key: 'status', title: '状态',
      render: (u: any) => {
        const st = getStatusInfo(u)
        return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
      },
    },
    { key: 'created', title: '注册时间', render: (u: any) => <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</span> },
    { key: 'lastLogin', title: '最近登录', render: (u: any) => <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(u.last_login_at)}</span> },
    {
      key: 'actions', title: '', width: 60, headerStyle: { textAlign: 'center' as const },
      render: (u: any) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === u.id ? null : u.id) }} style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
              <MoreVertical size={14} />
            </button>
            {menuOpen === u.id && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', zIndex: 50, minWidth: 150, padding: '4px 0' }}>
                <button className="dropdown-item" onClick={() => { setMenuOpen(null); setDetailUser(u) }} style={{ color: 'var(--text-body)' }}><User size={14} /> 查看详情</button>
                <button className="dropdown-item" onClick={() => { setMenuOpen(null); openEdit(u) }} style={{ color: 'var(--text-body)' }}><Edit2 size={14} /> 编辑</button>
                <button className="dropdown-item warning" onClick={() => { setMenuOpen(null); handleResetPwd(u) }}><KeyRound size={14} /> 重置密码</button>
                <div style={{ height: 1, background: 'var(--border-secondary)', margin: '4px 8px' }} />
                {u.is_active === 0 ? (
                  <button className="dropdown-item success" onClick={() => { setMenuOpen(null); handleApprove(u) }}><CheckCircle2 size={14} /> 审批激活</button>
                ) : (
                  <button className="dropdown-item" onClick={() => { setMenuOpen(null); handleToggleStatus(u) }} style={{ color: u.is_active === 1 ? 'var(--color-warning)' : 'var(--color-success)' }}><Power size={14} /> {u.is_active === 1 ? '禁用' : '启用'}</button>
                )}
                <button className="dropdown-item danger" onClick={() => { setMenuOpen(null); handleDelete(u) }}><Trash2 size={14} /> 删除</button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ], [menuOpen])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="用户管理"
        subtitle="管理平台成员账号、角色与启用状态"
        actions={<>
          <Button variant="secondary" size="sm" onClick={handleExport}><Download size={14} /> 导出</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowInviteModal(true)}><Link2 size={14} /> 邀请链接</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> 新增用户</Button>
        </>}
      />

      <StatsCards cards={overviewCards} columns={isMobile ? 2 : 3} />

      <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)' }}>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="搜索姓名、账号、手机号..."
          filters={[
            { value: roleFilter, onChange: setRoleFilter, options: [{ value: 'all', label: '全部角色' }, ...Object.entries(roleMap).map(([k, v]) => ({ value: k, label: v.label }))] },
            { value: statusFilter, onChange: setStatusFilter, options: [{ value: 'all', label: '全部状态' }, { value: 'active', label: '启用' }, { value: 'pending', label: '待审批' }, { value: 'disabled', label: '禁用' }] },
          ]}
          resultCount={filtered.length}
          hasFilters={hasFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
        />

        <BatchActionBar selectedCount={selectedCount} onClear={() => setSelected([])}>
          <Button size="sm" onClick={() => handleBatchToggle(true)}>批量启用</Button>
          <Button variant="danger" size="sm" onClick={() => handleBatchToggle(false)}>批量禁用</Button>
        </BatchActionBar>

        {loading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="暂无用户数据"
            subtitle={hasFilters ? '没有找到匹配的用户，试试调整筛选条件' : '点击右上角「新增用户」来创建第一个账号'}
            action={!hasFilters ? { label: '新增用户', onClick: () => setShowCreate(true), icon: Plus } : undefined}
          />
        ) : (
          <DataTable
            columns={tableColumns}
            data={paged}
            rowKey={(u: any) => u.id}
            selected={selectedSet}
            onSelect={(id) => toggleSelect(id as number)}
            onSelectAll={toggleAll}
            allSelected={hasAllOnPage}
            indeterminate={someSelected}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalCount={filtered.length}
            pageSize={PAGE_SIZE}
          />
        )}
      </div>

      {/* Detail Sheet */}
      <UserDetailSheet
        detailUser={detailUser}
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        onEdit={openEdit}
      />

      {/* Create Modal */}
      <UserFormModal
        mode="create"
        editUser={null}
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={load}
        users={users}
      />

      {/* Edit Modal */}
      <UserFormModal
        mode="edit"
        editUser={editUser}
        open={showEdit}
        onClose={() => { setShowEdit(false); setEditUser(null) }}
        onSaved={load}
        users={users}
      />

      {/* Invite Link Modal */}
      <InviteLinkSection
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  )
}
