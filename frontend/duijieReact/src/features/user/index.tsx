import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit2, Shield, Loader2, User, Search, Power, Link2, Clock, CheckCircle2, KeyRound, Download, ChevronLeft, ChevronRight, Users, X, MoreVertical } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useUsers, useInvalidate } from '../../hooks/useApi'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import useIsMobile from '../ui/useIsMobile'
import UserDetailSheet from './components/UserDetailSheet'
import UserFormModal from './components/UserFormModal'
import InviteLinkSection from './components/InviteLinkSection'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: 'var(--color-danger)', bg: 'var(--bg-danger)', icon: Shield },
  member: { label: '成员', color: 'var(--brand)', bg: 'var(--brand-light)', icon: User },
}

const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: '启用', color: 'var(--color-success)', bg: 'var(--bg-success)' },
  0: { label: '待审批', color: 'var(--color-warning)', bg: 'var(--bg-warning)' },
  2: { label: '禁用', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
}

const PAGE_SIZE = 10

const maskPhone = (p: string) => p ? p.replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : ''
const maskEmail = (e: string) => e ? e.replace(/(.{2}).+(@.+)/, '$1***$2') : ''
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

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
    const r = await fetchApi(`/api/users/${u.id}`, { method: 'DELETE' })
    if (r.success) { toast('已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const handleResetPwd = async (u: any) => {
    if (!(await confirm({ message: `确定重置「${u.nickname || u.username}」的密码为 123456？`, danger: true }))) return
    const r = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ password: '123456' }) })
    if (r.success) toast('密码已重置为 123456', 'success')
    else toast(r.message || '操作失败', 'error')
  }

  const handleToggleStatus = async (u: any) => {
    const active = u.is_active === 1
    const label = active ? '禁用' : '启用'
    if (!(await confirm({ message: `确定${label}账号「${u.nickname || u.username}」？`, danger: active }))) return
    const r = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: active ? 2 : 1 }) })
    if (r.success) { toast(`已${label}`, 'success'); load() }
    else toast(r.message || '操作失败', 'error')
  }

  const handleApprove = async (u: any) => {
    const r = await fetchApi(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: 1 }) })
    if (r.success) { toast('已审批激活', 'success'); load() }
    else toast(r.message || '操作失败', 'error')
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

  const getStatusInfo = (u: any) => {
    if (u.is_active === 0) return statusMap[0]
    if (u.is_active === 2) return statusMap[2]
    return statusMap[1]
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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.02em' }}>
            用户管理
          </h1>
          <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0', fontSize: 13 }}>管理平台成员账号、角色与启用状态</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={handleExport} style={{ fontSize: 13, padding: '7px 14px' }}><Download size={14} /> 导出</Button>
          <Button variant="secondary" onClick={() => setShowInviteModal(true)} style={{ fontSize: 13, padding: '7px 14px' }}><Link2 size={14} /> 邀请链接</Button>
          <Button onClick={() => setShowCreate(true)} style={{ fontSize: 13, padding: '7px 14px' }}><Plus size={14} /> 新增用户</Button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {overviewCards.map(s => (
          <div key={s.label} style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名、账号、手机号..."
              style={{ width: '100%', padding: '7px 30px 7px 32px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }}>
            <option value="all">全部角色</option>
            {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }}>
            <option value="all">全部状态</option>
            <option value="active">启用</option>
            <option value="pending">待审批</option>
            <option value="disabled">禁用</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={12} /> 清除筛选 ({activeFilterCount})
            </button>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            {filtered.length} 条结果
          </div>
        </div>

        {/* Batch action bar */}
        {selectedCount > 0 && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--brand-light)' }}>
            <span style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>已选 {selectedCount} 项</span>
            <Button style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleBatchToggle(true)}>批量启用</Button>
            <Button variant="danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleBatchToggle(false)}>批量禁用</Button>
            <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>取消选择</button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Users size={40} color="var(--text-disabled)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>暂无用户数据</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              {hasFilters ? '没有找到匹配的用户，试试调整筛选条件' : '点击右上角「新增用户」来创建第一个账号'}
            </div>
            {!hasFilters && (
              <Button onClick={() => setShowCreate(true)} style={{ fontSize: 13 }}><Plus size={14} /> 新增用户</Button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', width: 40 }}>
                      <input type="checkbox" checked={hasAllOnPage} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                    </th>
                    {['用户', '联系方式', '角色', '状态', '注册时间', '最近登录'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                    <th style={{ padding: '10px 16px', fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'center', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((u: any) => {
                    const ri = roleMap[u.role] || roleMap.member
                    const RIcon = ri.icon
                    const st = getStatusInfo(u)
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setDetailUser(u)}>
                            <Avatar name={u.nickname || u.username} size={34} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', lineHeight: 1.3 }}>{u.nickname || u.username}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{u.phone ? maskPhone(u.phone) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{u.email ? maskEmail(u.email) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: ri.bg, color: ri.color, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <RIcon size={10} /> {ri.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(u.last_login_at)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === u.id ? null : u.id) }}
                              style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                            >
                              <MoreVertical size={14} />
                            </button>
                            {menuOpen === u.id && (
                              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', zIndex: 50, minWidth: 150, padding: '4px 0' }}>
                                <button className="dropdown-item" onClick={() => { setMenuOpen(null); setDetailUser(u) }} style={{ color: 'var(--text-body)' }}>
                                  <User size={14} /> 查看详情
                                </button>
                                <button className="dropdown-item" onClick={() => { setMenuOpen(null); openEdit(u) }} style={{ color: 'var(--text-body)' }}>
                                  <Edit2 size={14} /> 编辑
                                </button>
                                <button className="dropdown-item warning" onClick={() => { setMenuOpen(null); handleResetPwd(u) }}>
                                  <KeyRound size={14} /> 重置密码
                                </button>
                                <div style={{ height: 1, background: 'var(--border-secondary)', margin: '4px 8px' }} />
                                {u.is_active === 0 ? (
                                  <button className="dropdown-item success" onClick={() => { setMenuOpen(null); handleApprove(u) }}>
                                    <CheckCircle2 size={14} /> 审批激活
                                  </button>
                                ) : (
                                  <button className="dropdown-item" onClick={() => { setMenuOpen(null); handleToggleStatus(u) }} style={{ color: u.is_active === 1 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                    <Power size={14} /> {u.is_active === 1 ? '禁用' : '启用'}
                                  </button>
                                )}
                                <button className="dropdown-item danger" onClick={() => { setMenuOpen(null); handleDelete(u) }}>
                                  <Trash2 size={14} /> 删除
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-secondary)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? 'var(--text-disabled)' : 'var(--text-body)', display: 'flex' }}><ChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map((p, idx, arr) => {
                    const prev = arr[idx - 1]
                    const showEllipsis = prev && p - prev > 1
                    return (
                      <span key={p}>
                        {showEllipsis && <span style={{ padding: '0 4px', color: 'var(--text-tertiary)', fontSize: 12 }}>…</span>}
                        <button onClick={() => setPage(p)} style={{ minWidth: 30, padding: '5px 8px', borderRadius: 6, border: p === page ? 'none' : '1px solid var(--border-primary)', background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-body)', fontSize: 12, fontWeight: p === page ? 600 : 400, cursor: 'pointer' }}>{p}</button>
                      </span>
                    )
                  })}
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? 'var(--text-disabled)' : 'var(--text-body)', display: 'flex' }}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
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
