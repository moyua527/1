import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit2, Shield, Loader2, Code2, Briefcase, User, Search, Power, Link2, Copy, Clock, CheckCircle2, Mail, Phone, Calendar, Hash, MapPin, UserCheck, Eye, KeyRound, Download, ChevronLeft, ChevronRight, Users, X, MoreVertical } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { clientApi } from '../client/services/api'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: '#dc2626', bg: '#fef2f2', icon: Shield },
  tech: { label: '技术员', color: '#7c3aed', bg: '#f5f3ff', icon: Code2 },
  business: { label: '业务员', color: '#0891b2', bg: '#ecfeff', icon: Briefcase },
  member: { label: '成员', color: '#2563eb', bg: '#eff6ff', icon: User },
}

const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: '启用', color: '#16a34a', bg: '#f0fdf4' },
  0: { label: '待审批', color: '#d97706', bg: '#fffbeb' },
  2: { label: '禁用', color: '#94a3b8', bg: '#f1f5f9' },
}

const PAGE_SIZE = 10

const maskPhone = (p: string) => p ? p.replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : ''
const maskEmail = (e: string) => e ? e.replace(/(.{2}).+(@.+)/, '$1***$2') : ''
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

const thStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', textAlign: 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc' }
const tdStyle: React.CSSProperties = { padding: '12px 12px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' }

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', nickname: '', role: 'member', email: '', phone: '', client_id: '', manager_id: '' })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inviteLinks, setInviteLinks] = useState<any[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ preset_role: 'member', expires_hours: '72', note: '' })
  const [detailUser, setDetailUser] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const selectStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }
  const groupTitle = (t: string) => <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', padding: '8px 0 4px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>{t}</div>

  const load = () => {
    setLoading(true)
    Promise.all([
      fetchApi('/api/users'),
      clientApi.list(),
      fetchApi('/api/invite-links'),
    ]).then(([ur, cr, lr]) => {
      if (ur.success) setUsers(ur.data || [])
      if (cr.success) setClients(cr.data || [])
      if (lr.success) setInviteLinks(lr.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const resetForm = () => setForm({ username: '', password: '', nickname: '', role: 'member', email: '', phone: '', client_id: '', manager_id: '' })

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

  const handleCreate = async () => {
    if (!form.username.trim()) { toast('请输入用户名', 'error'); return }
    if (!form.password.trim()) { toast('请输入密码', 'error'); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast('邮箱格式不正确', 'error'); return }
    if (form.phone && !/^1\d{10}$/.test(form.phone)) { toast('手机号格式不正确', 'error'); return }
    setSubmitting(true)
    const r = await fetchApi('/api/users', { method: 'POST', body: JSON.stringify(form) })
    setSubmitting(false)
    if (r.success) { toast('账号创建成功', 'success'); setShowCreate(false); resetForm(); load() }
    else toast(r.message || '创建失败', 'error')
  }

  const openEdit = (u: any) => {
    setEditUser(u)
    setForm({ username: u.username, password: '', nickname: u.nickname || '', role: u.role, email: u.email || '', phone: u.phone || '', client_id: u.client_id ? String(u.client_id) : '', manager_id: u.manager_id ? String(u.manager_id) : '' })
    setShowEdit(true)
  }

  const handleUpdate = async () => {
    if (!editUser) return
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast('邮箱格式不正确', 'error'); return }
    if (form.phone && !/^1\d{10}$/.test(form.phone)) { toast('手机号格式不正确', 'error'); return }
    if (form.role !== editUser.role) {
      if (!(await confirm({ message: `确定将角色从「${roleMap[editUser.role]?.label}」改为「${roleMap[form.role]?.label}」？`, danger: false }))) return
    }
    setSubmitting(true)
    const body: any = { nickname: form.nickname, role: form.role, email: form.email || null, phone: form.phone || null, manager_id: form.manager_id ? Number(form.manager_id) : null }
    if (form.password.trim()) body.password = form.password
    const r = await fetchApi(`/api/users/${editUser.id}`, { method: 'PUT', body: JSON.stringify(body) })
    setSubmitting(false)
    if (r.success) { toast('更新成功', 'success'); setShowEdit(false); setEditUser(null); resetForm(); load() }
    else toast(r.message || '更新失败', 'error')
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="#2563eb" /> 用户管理
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>管理系统账号和角色权限</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={handleExport}><Download size={15} /> 导出</Button>
          <Button variant="secondary" onClick={() => setShowInviteModal(true)}><Link2 size={15} /> 邀请链接</Button>
          <Button onClick={() => { resetForm(); setShowCreate(true) }}><Plus size={15} /> 新增用户</Button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: '总用户', value: statCounts.total, color: '#2563eb', bg: '#eff6ff' },
          { label: '已启用', value: statCounts.active, color: '#16a34a', bg: '#f0fdf4' },
          { label: '待审批', value: statCounts.pending, color: '#d97706', bg: '#fffbeb' },
          { label: '已禁用', value: statCounts.disabled, color: '#94a3b8', bg: '#f1f5f9' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索姓名/账号/手机号..." style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}><X size={14} /></button>}
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#334155' }}>
          <option value="all">全部角色</option>
          {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#334155' }}>
          <option value="all">全部状态</option>
          <option value="active">启用</option>
          <option value="pending">待审批</option>
          <option value="disabled">禁用</option>
        </select>
        <div style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
          共 {filtered.length} 条结果
        </div>
      </div>

      {/* Batch action bar */}
      {selected.length > 0 && (
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>已选 {selected.length} 项</span>
          <Button style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleBatchToggle(true)}>批量启用</Button>
          <Button variant="danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleBatchToggle(false)}>批量禁用</Button>
          <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 12 }}>取消选择</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Users size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, color: '#64748b', marginBottom: 8 }}>暂无用户</div>
          <Button onClick={() => { resetForm(); setShowCreate(true) }}><Plus size={14} /> 去新增</Button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
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
                    <tr key={u.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <td style={tdStyle}>
                        <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{u.display_id || `#${u.id}`}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setDetailUser(u)}>
                          <Avatar name={u.nickname || u.username} size={32} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{u.nickname || u.username}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{u.phone ? maskPhone(u.phone) : '-'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email ? maskEmail(u.email) : '-'}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: ri.bg, color: ri.color, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <RIcon size={11} /> {ri.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(u.last_login_at)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === u.id ? null : u.id) }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                            <MoreVertical size={16} />
                          </button>
                          {menuOpen === u.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, transform: 'translateX(0)', background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', zIndex: 50, minWidth: 140, overflow: 'hidden', padding: '4px 0' }}>
                              <button onClick={() => { setMenuOpen(null); openEdit(u) }} style={{ ...menuItemStyle, color: '#334155' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <Edit2 size={14} /> 编辑
                              </button>
                              <button onClick={() => { setMenuOpen(null); handleResetPwd(u) }} style={{ ...menuItemStyle, color: '#d97706' }} onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <KeyRound size={14} /> 重置密码
                              </button>
                              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                              {u.is_active === 0 ? (
                                <button onClick={() => { setMenuOpen(null); handleApprove(u) }} style={{ ...menuItemStyle, color: '#16a34a' }} onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                  <CheckCircle2 size={14} /> 审批激活
                                </button>
                              ) : (
                                <button onClick={() => { setMenuOpen(null); handleToggleStatus(u) }} style={{ ...menuItemStyle, color: u.is_active === 1 ? '#d97706' : '#16a34a' }} onMouseEnter={e => (e.currentTarget.style.background = u.is_active === 1 ? '#fffbeb' : '#f0fdf4')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                  <Power size={14} /> {u.is_active === 1 ? '禁用' : '启用'}
                                </button>
                              )}
                              <button onClick={() => { setMenuOpen(null); handleDelete(u) }} style={{ ...menuItemStyle, color: '#dc2626' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                显示 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} / 共 {filtered.length} 条
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#cbd5e1' : '#334155', display: 'flex' }}><ChevronLeft size={14} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map((p, idx, arr) => {
                  const prev = arr[idx - 1]
                  const showEllipsis = prev && p - prev > 1
                  return (
                    <span key={p}>
                      {showEllipsis && <span style={{ padding: '0 4px', color: '#94a3b8', fontSize: 12 }}>…</span>}
                      <button onClick={() => setPage(p)} style={{ minWidth: 30, padding: '5px 8px', borderRadius: 6, border: '1px solid ' + (p === page ? '#2563eb' : '#e2e8f0'), background: p === page ? '#2563eb' : '#fff', color: p === page ? '#fff' : '#334155', fontSize: 12, fontWeight: p === page ? 600 : 400, cursor: 'pointer' }}>{p}</button>
                    </span>
                  )
                })}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#cbd5e1' : '#334155', display: 'flex' }}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title="账号详情">
        {detailUser && (() => {
          const r = roleMap[detailUser.role] || roleMap.member
          const RIcon = r.icon
          const st = getStatusInfo(detailUser)
          const genderLabel = detailUser.gender === 1 ? '男' : detailUser.gender === 2 ? '女' : '未设置'
          const sections = [
            { title: '基础信息', icon: User, items: [
              { label: '用户ID', value: detailUser.display_id || `#${detailUser.id}` },
              { label: '用户名', value: `@${detailUser.username}` },
              { label: '昵称', value: detailUser.nickname || '未设置' },
              { label: '性别', value: genderLabel },
              { label: '手机号', value: detailUser.phone || '未绑定' },
              { label: '邮箱', value: detailUser.email || '未绑定' },
            ]},
            { title: '权限信息', icon: Shield, items: [
              { label: '角色', value: r.label, color: r.color },
              { label: '状态', value: st.label, color: st.color },
              { label: '上级', value: detailUser.manager_name || '无' },
              { label: '邀请码', value: detailUser.personal_invite_code || '无' },
            ]},
            { title: '操作记录', icon: Clock, items: [
              { label: '注册时间', value: fmtDate(detailUser.created_at) },
              { label: '最近登录', value: fmtDate(detailUser.last_login_at) },
              { label: '最后修改', value: fmtDate(detailUser.updated_at) },
              { label: '地区码', value: detailUser.area_code || '未设置' },
            ]},
          ]
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                <Avatar name={detailUser.nickname || detailUser.username} size={56} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{detailUser.nickname || detailUser.username}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>@{detailUser.username}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: r.bg, color: r.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><RIcon size={12} /> {r.label}</span>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
                  </div>
                </div>
              </div>
              {sections.map(sec => (
                <div key={sec.title} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <sec.icon size={14} color="#64748b" /> {sec.title}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                    {sec.items.map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #fafafa' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 56 }}>{item.label}</span>
                        <span style={{ fontSize: 13, color: (item as any).color || '#0f172a', fontWeight: 500, wordBreak: 'break-all' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="secondary" onClick={() => setDetailUser(null)}>关闭</Button>
                <Button onClick={() => { setDetailUser(null); openEdit(detailUser) }}><Edit2 size={14} /> 编辑</Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新增用户">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupTitle('基础信息')}
          <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Input label="手机号" placeholder="11位手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div style={{ flex: 1 }}><Input label="邮箱" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>

          {groupTitle('账号信息')}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Input label="用户名 *" placeholder="登录用户名" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><Input label="密码 *" placeholder="登录密码" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
          </div>

          {groupTitle('权限信息')}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>角色 <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={selectStyle}>
                {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>上级经理</label>
              <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })} style={selectStyle}>
                <option value="">无</option>
                {users.filter(u => u.role === 'admin').map(u => (
                  <option key={u.id} value={u.id}>{u.nickname || u.username} ({roleMap[u.role]?.label})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditUser(null) }} title="编辑用户">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupTitle('基础信息')}
          <div style={{ fontSize: 13, color: '#64748b', padding: '4px 0' }}>用户名: <strong style={{ color: '#0f172a' }}>{editUser?.username}</strong></div>
          <Input label="昵称" placeholder="显示名称" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Input label="手机号" placeholder="11位手机号" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div style={{ flex: 1 }}><Input label="邮箱" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>

          {groupTitle('账号安全')}
          <Input label="新密码" placeholder="留空则不修改" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

          {groupTitle('权限信息')}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>角色</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={selectStyle}>
                {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>上级经理</label>
              <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })} style={selectStyle}>
                <option value="">无</option>
                {users.filter(u => u.role === 'admin' && u.id !== editUser?.id).map(u => (
                  <option key={u.id} value={u.id}>{u.nickname || u.username} ({roleMap[u.role]?.label})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={() => { setShowEdit(false); setEditUser(null) }}>取消</Button>
            <Button onClick={handleUpdate} disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>

      {/* Invite Link Modal */}
      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="邀请链接管理">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>生成新邀请链接</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>预设角色</label>
                <select value={inviteForm.preset_role} onChange={e => setInviteForm({ ...inviteForm, preset_role: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  {Object.entries(roleMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>有效期</label>
                <select value={inviteForm.expires_hours} onChange={e => setInviteForm({ ...inviteForm, expires_hours: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="24">24小时</option>
                  <option value="72">3天</option>
                  <option value="168">7天</option>
                  <option value="720">30天</option>
                  <option value="">永久</option>
                </select>
              </div>
            </div>
            <Input label="备注" placeholder="可选" value={inviteForm.note} onChange={e => setInviteForm({ ...inviteForm, note: e.target.value })} />
            <Button onClick={async () => {
              const r2 = await fetchApi('/api/invite-links', { method: 'POST', body: JSON.stringify({ preset_role: inviteForm.preset_role, expires_hours: inviteForm.expires_hours ? Number(inviteForm.expires_hours) : null, note: inviteForm.note }) })
              if (r2.success) {
                const url = `${window.location.origin}/?invite=${r2.data.token}`
                navigator.clipboard.writeText(url).then(() => toast('链接已复制到剪贴板', 'success')).catch(() => toast('生成成功，请手动复制', 'success'))
                load()
              } else toast(r2.message || '生成失败', 'error')
            }}><Link2 size={14} /> 生成并复制链接</Button>
          </div>
          {inviteLinks.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>已生成的链接 ({inviteLinks.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {inviteLinks.map((link: any) => {
                  const used = !!link.used_by
                  const expired = link.expires_at && new Date(link.expires_at) < new Date()
                  const status = used ? '已使用' : expired ? '已过期' : '可用'
                  const statusColor = used ? '#16a34a' : expired ? '#dc2626' : '#2563eb'
                  return (
                    <div key={link.id} style={{ padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ color: statusColor, fontWeight: 600, fontSize: 11, padding: '1px 6px', borderRadius: 4, background: used ? '#f0fdf4' : expired ? '#fef2f2' : '#eff6ff' }}>{status}</span>
                          <span style={{ color: '#64748b' }}>角色: {roleMap[link.preset_role]?.label || link.preset_role}</span>
                          {link.note && <span style={{ color: '#94a3b8' }}>· {link.note}</span>}
                        </div>
                        {used && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>使用者: {link.used_by_name || link.used_by_username}</div>}
                      </div>
                      {!used && !expired && (
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?invite=${link.token}`); toast('已复制', 'success') }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}><Copy size={14} /></button>
                      )}
                      <button onClick={async () => { const r2 = await fetchApi(`/api/invite-links/${link.id}`, { method: 'DELETE' }); if (r2.success) { toast('已删除', 'success'); load() } }} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#dc2626', display: 'flex' }}><Trash2 size={14} /></button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
