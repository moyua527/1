import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit2, Shield, Loader2, User, Search, Power, Link2, Copy, Clock, CheckCircle2, Mail, Phone, Calendar, Hash, MapPin, UserCheck, Eye, KeyRound, Download, ChevronLeft, ChevronRight, Users, X, MoreVertical } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useUsers, useClients, useInvalidate } from '../../hooks/useApi'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import UserDetailModal from './components/UserDetailModal'
import UserFormModal from './components/UserFormModal'
import InviteLinkSection from './components/InviteLinkSection'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: 'var(--color-danger)', bg: '#fef2f2', icon: Shield },
  member: { label: '成员', color: 'var(--brand)', bg: 'var(--bg-selected)', icon: User },
}

const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: '启用', color: 'var(--color-success)', bg: '#f0fdf4' },
  0: { label: '待审批', color: 'var(--color-warning)', bg: '#fffbeb' },
  2: { label: '禁用', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
}

const PAGE_SIZE = 10

const maskPhone = (p: string) => p ? p.replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : ''
const maskEmail = (e: string) => e ? e.replace(/(.{2}).+(@.+)/, '$1***$2') : ''
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

const thStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '2px solid var(--border-primary)', whiteSpace: 'nowrap', background: 'var(--bg-secondary)' }
const tdStyle: React.CSSProperties = { padding: '12px 12px', fontSize: 13, color: 'var(--text-body)', borderBottom: '1px solid var(--border-secondary)' }

export default function UserManagement() {
  const { data: users = [], isLoading: loading } = useUsers()
  const { data: clients = [] } = useClients()
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

  const load = () => invalidate('users', 'clients')

  const filtered = useMemo(() => {
    return users.filter((u: any) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter === 'active' && u.is_active !== 1) return false
      if (statusFilter === 'pending' && u.is_active !== 0) return false
      if (statusFilter === 'disabled' && u.is_active !== 2 && !(u.is_active !== 1 && u.is_active !== 0)) return false
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

  const openEdit = (u: any) => {
    setEditUser(u)
    setShowEdit(true)
  }

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
    for (const uid of selected) {
      await fetchApi(`/api/users/${uid}`, { method: 'PUT', body: JSON.stringify({ is_active: activate ? 1 : 2 }) })
    }
    toast(`已批量${label} ${selected.length} 个账号`, 'success')
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
    a.href = URL.createObjectURL(blob)
    a.download = `用户列表_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast('导出成功', 'success')
  }

  const toggleSelect = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAll = () => setSelected(prev => prev.length === paged.length ? [] : paged.map(u => u.id))

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  const menuItemStyle: React.CSSProperties = { width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, whiteSpace: 'nowrap' }

  const getStatusInfo = (u: any) => {
    if (u.is_active === 0) return statusMap[0]
    if (u.is_active === 2) return statusMap[2]
    return statusMap[1]
  }

  const statCounts = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active === 1).length,
    pending: users.filter(u => u.is_active === 0).length,
    disabled: users.filter(u => u.is_active === 2).length,
  }), [users])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--brand)" /> 用户管理
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0', fontSize: 14 }}>管理系统账号和角色权限</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={handleExport}><Download size={15} /> 导出</Button>
          <Button variant="secondary" onClick={() => setShowInviteModal(true)}><Link2 size={15} /> 邀请链接</Button>
          <Button onClick={() => setShowCreate(true)}><Plus size={15} /> 新增用户</Button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: '总用户', value: statCounts.total, color: 'var(--brand)', bg: 'var(--bg-selected)' },
          { label: '已启用', value: statCounts.active, color: 'var(--color-success)', bg: '#f0fdf4' },
          { label: '待审批', value: statCounts.pending, color: 'var(--color-warning)', bg: '#fffbeb' },
          { label: '已禁用', value: statCounts.disabled, color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索姓名/账号/手机号..." style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}><X size={14} /></button>}
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
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          共 {filtered.length} 条结果
        </div>
      </div>

      {/* Batch action bar */}
      {selected.length > 0 && (
        <div style={{ background: 'var(--bg-selected)', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>已选 {selected.length} 项</span>
          <Button style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleBatchToggle(true)}>批量启用</Button>
          <Button variant="danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleBatchToggle(false)}>批量禁用</Button>
          <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>取消选择</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 60, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Users size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>暂无用户</div>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} /> 去新增</Button>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 40 }}>
                    <input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th style={thStyle}>用户ID</th>
                  <th style={thStyle}>姓名</th>
                  <th style={thStyle}>联系方式</th>
                  <th style={thStyle}>角色</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>注册时间</th>
                  <th style={thStyle}>最近登录</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u: any) => {
                  const ri = roleMap[u.role] || roleMap.member
                  const RIcon = ri.icon
                  const st = getStatusInfo(u)
                  return (
                    <tr key={u.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-primary)')}>
                      <td style={tdStyle}>
                        <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{u.display_id || `#${u.id}`}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setDetailUser(u)}>
                          <Avatar name={u.nickname || u.username} size={32} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>{u.nickname || u.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.phone ? maskPhone(u.phone) : '-'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{u.email ? maskEmail(u.email) : '-'}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: ri.bg, color: ri.color, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <RIcon size={11} /> {ri.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(u.last_login_at)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === u.id ? null : u.id) }} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                            <MoreVertical size={16} />
                          </button>
                          {menuOpen === u.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, transform: 'translateX(0)', background: 'var(--bg-primary)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', zIndex: 50, minWidth: 140, overflow: 'hidden', padding: '4px 0' }}>
                              <button onClick={() => { setMenuOpen(null); openEdit(u) }} style={{ ...menuItemStyle, color: 'var(--text-body)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <Edit2 size={14} /> 编辑
                              </button>
                              <button onClick={() => { setMenuOpen(null); handleResetPwd(u) }} style={{ ...menuItemStyle, color: 'var(--color-warning)' }} onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <KeyRound size={14} /> 重置密码
                              </button>
                              <div style={{ height: 1, background: 'var(--bg-tertiary)', margin: '4px 0' }} />
                              {u.is_active === 0 ? (
                                <button onClick={() => { setMenuOpen(null); handleApprove(u) }} style={{ ...menuItemStyle, color: 'var(--color-success)' }} onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                  <CheckCircle2 size={14} /> 审批激活
                                </button>
                              ) : (
                                <button onClick={() => { setMenuOpen(null); handleToggleStatus(u) }} style={{ ...menuItemStyle, color: u.is_active === 1 ? 'var(--color-warning)' : 'var(--color-success)' }} onMouseEnter={e => (e.currentTarget.style.background = u.is_active === 1 ? '#fffbeb' : '#f0fdf4')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                  <Power size={14} /> {u.is_active === 1 ? '禁用' : '启用'}
                                </button>
                              )}
                              <button onClick={() => { setMenuOpen(null); handleDelete(u) }} style={{ ...menuItemStyle, color: 'var(--color-danger)' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
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
                显示 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} / 共 {filtered.length} 条
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? 'var(--text-disabled)' : 'var(--text-body)', display: 'flex' }}><ChevronLeft size={14} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map((p, idx, arr) => {
                  const prev = arr[idx - 1]
                  const showEllipsis = prev && p - prev > 1
                  return (
                    <span key={p}>
                      {showEllipsis && <span style={{ padding: '0 4px', color: 'var(--text-tertiary)', fontSize: 12 }}>…</span>}
                      <button onClick={() => setPage(p)} style={{ minWidth: 30, padding: '5px 8px', borderRadius: 6, border: '1px solid ' + (p === page ? 'var(--brand)' : 'var(--border-primary)'), background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? 'var(--bg-primary)' : 'var(--text-body)', fontSize: 12, fontWeight: p === page ? 600 : 400, cursor: 'pointer' }}>{p}</button>
                    </span>
                  )
                })}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? 'var(--text-disabled)' : 'var(--text-body)', display: 'flex' }}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <UserDetailModal
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
