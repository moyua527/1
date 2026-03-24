import { useState, useEffect } from 'react'
import { Building2, Building, Phone, Mail, Users, MapPin, Clock, Briefcase, FileText, Edit3, UserPlus, X, Trash2, Plus, ChevronRight, ChevronDown, Hash, Calendar, GitBranch, FolderTree } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }
const infoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', padding: '6px 0' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }
const selectStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }
const textareaStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }

const industryOptions = ['互联网/IT', '金融', '教育', '医疗健康', '制造业', '房地产', '零售/电商', '物流', '传媒/文化', '咨询/服务', '能源', '农业', '政府/公共事业', '其他']
const scaleOptions = ['1-10人', '11-50人', '51-200人', '201-500人', '501-1000人', '1000人以上']

export default function Enterprise() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'members' | 'departments' | 'tree'>('members')
  const [editEntOpen, setEditEntOpen] = useState(false)
  const [entForm, setEntForm] = useState({ name: '', company: '', email: '', phone: '', notes: '', industry: '', scale: '', address: '' })
  const [entSaving, setEntSaving] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', company: '', email: '', phone: '', notes: '', industry: '', scale: '', address: '' })
  const [creating, setCreating] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [memberForm, setMemberForm] = useState({ name: '', position: '', department: '', phone: '', email: '', notes: '', employee_id: '', join_date: '', supervisor: '', department_id: '' })
  const [memberSaving, setMemberSaving] = useState(false)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [deptForm, setDeptForm] = useState({ name: '', parent_id: '' })
  const [deptSaving, setDeptSaving] = useState(false)
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set())

  const load = () => {
    fetchApi('/api/my-enterprise').then(r => {
      if (r.success) setData(r.data)
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  // === 企业操作 ===
  const openEditEnt = () => {
    if (!data) return
    const e = data.enterprise
    setEntForm({ name: e.name || '', company: e.company || '', email: e.email || '', phone: e.phone || '', notes: e.notes || '', industry: e.industry || '', scale: e.scale || '', address: e.address || '' })
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
  const openAddMember = () => {
    setEditingMember(null)
    setMemberForm({ name: '', position: '', department: '', phone: '', email: '', notes: '', employee_id: '', join_date: '', supervisor: '', department_id: '' })
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

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  if (!data) return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>企业管理</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 0 }}>创建并管理您的企业信息</p>
      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>创建企业</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>填写信息创建您的企业，之后可管理部门和成员</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="企业名称 *" placeholder="如：XX科技" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
          <Input label="公司全称" placeholder="如：XX科技有限公司" value={createForm.company} onChange={e => setCreateForm({ ...createForm, company: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>行业</label>
              <select value={createForm.industry} onChange={e => setCreateForm({ ...createForm, industry: e.target.value })} style={selectStyle}>
                <option value="">请选择行业</option>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>规模</label>
              <select value={createForm.scale} onChange={e => setCreateForm({ ...createForm, scale: e.target.value })} style={selectStyle}>
                <option value="">请选择规模</option>
                {scaleOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="邮箱" placeholder="company@example.com" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            <Input label="电话" placeholder="联系电话" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
          </div>
          <Input label="地址" placeholder="公司地址" value={createForm.address} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} />
          <div>
            <label style={labelStyle}>备注</label>
            <textarea value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} rows={2} placeholder="企业简介或备注信息" style={textareaStyle} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCreate} disabled={creating}>{creating ? '创建中...' : '创建企业'}</Button>
          </div>
        </div>
      </div>
    </div>
  )

  const { enterprise: ent, members, departments = [] } = data
  const getDeptName = (id: number | null) => departments.find((d: any) => d.id === id)?.name || ''

  // === 组织架构树 ===
  const buildTree = () => {
    const rootDepts = departments.filter((d: any) => !d.parent_id)
    const childDepts = (pid: number) => departments.filter((d: any) => d.parent_id === pid)
    const deptMembers = (did: number) => members.filter((m: any) => m.department_id === did)
    const unassigned = members.filter((m: any) => !m.department_id)

    const renderDept = (dept: any, level: number) => {
      const children = childDepts(dept.id)
      const mems = deptMembers(dept.id)
      const expanded = expandedDepts.has(dept.id)
      const hasContent = children.length > 0 || mems.length > 0
      return (
        <div key={dept.id}>
          <div onClick={() => hasContent && toggleDept(dept.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', paddingLeft: 12 + level * 24, cursor: hasContent ? 'pointer' : 'default', borderRadius: 8, background: expanded ? '#f8fafc' : 'transparent' }}>
            {hasContent ? (expanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />) : <span style={{ width: 14 }} />}
            <Building size={16} color="#2563eb" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{dept.name}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>({mems.length}人)</span>
          </div>
          {expanded && (
            <>
              {mems.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', paddingLeft: 36 + level * 24 }}>
                  <Avatar name={m.name} size={24} />
                  <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{m.name}</span>
                  {m.position && <span style={{ fontSize: 12, color: '#94a3b8' }}>· {m.position}</span>}
                  {m.employee_id && <span style={{ fontSize: 11, color: '#cbd5e1' }}>#{m.employee_id}</span>}
                </div>
              ))}
              {children.map((c: any) => renderDept(c, level + 1))}
            </>
          )}
        </div>
      )
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #e2e8f0', marginBottom: 8 }}>
          <Building2 size={18} color="#1d4ed8" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{ent.name}</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>({members.length}人)</span>
        </div>
        {rootDepts.map((d: any) => renderDept(d, 0))}
        {unassigned.length > 0 && (
          <div>
            <div onClick={() => toggleDept(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', cursor: 'pointer', borderRadius: 8, background: expandedDepts.has(-1) ? '#f8fafc' : 'transparent' }}>
              {expandedDepts.has(-1) ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
              <Users size={16} color="#94a3b8" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>未分配部门</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>({unassigned.length}人)</span>
            </div>
            {expandedDepts.has(-1) && unassigned.map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', paddingLeft: 36 }}>
                <Avatar name={m.name} size={24} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{m.name}</span>
                {m.position && <span style={{ fontSize: 12, color: '#94a3b8' }}>· {m.position}</span>}
              </div>
            ))}
          </div>
        )}
        {departments.length === 0 && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>请先创建部门并添加成员</div>
        )}
      </div>
    )
  }

  const tabItems = [
    { key: 'members' as const, label: '组织成员', icon: <Users size={15} />, count: members.length },
    { key: 'departments' as const, label: '部门管理', icon: <Building size={15} />, count: departments.length },
    { key: 'tree' as const, label: '组织架构', icon: <FolderTree size={15} /> },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>企业管理</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 0 }}>管理企业信息、部门与组织成员</p>

      {/* 企业信息卡片 */}
      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={28} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{ent.name}</span>
              {ent.industry && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>{ent.industry}</span>}
              {ent.scale && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontWeight: 500 }}>{ent.scale}</span>}
            </div>
            {ent.company && <div style={{ fontSize: 14, color: '#64748b' }}>{ent.company}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={openEditEnt} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#2563eb' }}>
              <Edit3 size={14} /> 编辑
            </button>
            <button onClick={handleDeleteEnterprise} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#dc2626' }}>
              <Trash2 size={14} /> 删除
            </button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px 24px' }}>
          {ent.company && <div style={infoRow}><Building size={16} color="#64748b" /> {ent.company}</div>}
          {ent.email && <div style={infoRow}><Mail size={16} color="#64748b" /> {ent.email}</div>}
          {ent.phone && <div style={infoRow}><Phone size={16} color="#64748b" /> {ent.phone}</div>}
          {ent.address && <div style={infoRow}><MapPin size={16} color="#64748b" /> {ent.address}</div>}
          {ent.industry && <div style={infoRow}><Briefcase size={16} color="#64748b" /> {ent.industry}</div>}
          {ent.scale && <div style={infoRow}><Users size={16} color="#64748b" /> {ent.scale}</div>}
          {ent.notes && <div style={{ ...infoRow, gridColumn: '1 / -1' }}><FileText size={16} color="#64748b" /> {ent.notes}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            <Clock size={12} /> 创建于 {new Date(ent.created_at).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      {/* Tab 栏 */}
      <div style={{ display: 'flex', gap: 0, marginTop: 16, borderBottom: '2px solid #e2e8f0' }}>
        {tabItems.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: tab === t.key ? '#2563eb' : '#64748b', background: 'transparent',
              borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2, transition: 'all 0.15s' }}>
            {t.icon} {t.label} {'count' in t && <span style={{ fontSize: 12, color: '#94a3b8' }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* 组织成员 */}
      {tab === 'members' && (
        <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button onClick={openAddMember}><UserPlus size={14} /> 添加成员</Button>
          </div>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无组织成员，点击"添加成员"开始</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {members.map((m: any) => (
                <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Avatar name={m.name} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                        {m.employee_id && <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>#{m.employee_id}</span>}
                      </div>
                      {m.position && <div style={{ fontSize: 12, color: '#64748b' }}>{m.position}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEditMember(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                      <button onClick={() => handleDeleteMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><X size={13} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', fontSize: 13, color: '#334155' }}>
                    {m.department_id && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building size={12} color="#94a3b8" />{getDeptName(m.department_id)}</div>}
                    {m.department && !m.department_id && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building size={12} color="#94a3b8" />{m.department}</div>}
                    {m.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} color="#94a3b8" />{m.phone}</div>}
                    {m.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} color="#94a3b8" />{m.email}</div>}
                    {m.supervisor && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GitBranch size={12} color="#94a3b8" />上级: {m.supervisor}</div>}
                    {m.join_date && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} color="#94a3b8" />入职: {m.join_date.slice(0, 10)}</div>}
                  </div>
                  {m.notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{m.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 部门管理 */}
      {tab === 'departments' && (
        <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button onClick={() => openAddDept()}><Plus size={14} /> 添加部门</Button>
          </div>
          {departments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无部门，点击"添加部门"创建组织结构</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {departments.filter((d: any) => !d.parent_id).map((dept: any) => {
                const children = departments.filter((d: any) => d.parent_id === dept.id)
                const memberCount = members.filter((m: any) => m.department_id === dept.id).length
                return (
                  <div key={dept.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fafbfc' }}>
                      <Building size={18} color="#2563eb" />
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{dept.name}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{memberCount}人</span>
                      <button onClick={() => openAddDept(dept.id)} title="添加子部门" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 2, display: 'flex' }}><Plus size={14} /></button>
                      <button onClick={() => openEditDept(dept)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={14} /></button>
                      <button onClick={() => handleDeleteDept(dept.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><Trash2 size={14} /></button>
                    </div>
                    {children.length > 0 && (
                      <div style={{ marginLeft: 28, borderLeft: '2px solid #e2e8f0', paddingLeft: 12, marginTop: 4 }}>
                        {children.map((child: any) => {
                          const childCount = members.filter((m: any) => m.department_id === child.id).length
                          return (
                            <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid #f1f5f9', borderRadius: 8, marginBottom: 4, background: '#fff' }}>
                              <Building size={14} color="#64748b" />
                              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#334155' }}>{child.name}</span>
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>{childCount}人</span>
                              <button onClick={() => openEditDept(child)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                              <button onClick={() => handleDeleteDept(child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><Trash2 size={13} /></button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 组织架构树 */}
      {tab === 'tree' && (
        <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
          {buildTree()}
        </div>
      )}

      {/* 编辑企业 Modal */}
      <Modal open={editEntOpen} onClose={() => setEditEntOpen(false)} title="编辑企业信息">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="企业名称 *" value={entForm.name} onChange={e => setEntForm({ ...entForm, name: e.target.value })} />
          <Input label="公司全称" placeholder="如：XX科技有限公司" value={entForm.company} onChange={e => setEntForm({ ...entForm, company: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>行业</label>
              <select value={entForm.industry} onChange={e => setEntForm({ ...entForm, industry: e.target.value })} style={selectStyle}>
                <option value="">请选择行业</option>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>规模</label>
              <select value={entForm.scale} onChange={e => setEntForm({ ...entForm, scale: e.target.value })} style={selectStyle}>
                <option value="">请选择规模</option>
                {scaleOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="邮箱" value={entForm.email} onChange={e => setEntForm({ ...entForm, email: e.target.value })} />
            <Input label="电话" value={entForm.phone} onChange={e => setEntForm({ ...entForm, phone: e.target.value })} />
          </div>
          <Input label="地址" value={entForm.address} onChange={e => setEntForm({ ...entForm, address: e.target.value })} />
          <div>
            <label style={labelStyle}>备注</label>
            <textarea value={entForm.notes} onChange={e => setEntForm({ ...entForm, notes: e.target.value })} rows={2} style={textareaStyle} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setEditEntOpen(false)}>取消</Button>
            <Button onClick={handleSaveEnt} disabled={entSaving}>{entSaving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>

      {/* 成员 Modal */}
      <Modal open={memberModalOpen} onClose={() => setMemberModalOpen(false)} title={editingMember ? '编辑成员' : '添加成员'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="姓名 *" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} />
            <Input label="工号" placeholder="如：E001" value={memberForm.employee_id} onChange={e => setMemberForm({ ...memberForm, employee_id: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="职位" placeholder="如：技术总监" value={memberForm.position} onChange={e => setMemberForm({ ...memberForm, position: e.target.value })} />
            <div>
              <label style={labelStyle}>所属部门</label>
              <select value={memberForm.department_id} onChange={e => setMemberForm({ ...memberForm, department_id: e.target.value })} style={selectStyle}>
                <option value="">未分配</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.parent_id ? '　└ ' : ''}{d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="电话" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} />
            <Input label="邮箱" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="直属上级" placeholder="上级姓名" value={memberForm.supervisor} onChange={e => setMemberForm({ ...memberForm, supervisor: e.target.value })} />
            <Input label="入职日期" type="date" value={memberForm.join_date} onChange={e => setMemberForm({ ...memberForm, join_date: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>备注</label>
            <textarea value={memberForm.notes} onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })} rows={2} style={textareaStyle} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setMemberModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveMember} disabled={memberSaving}>{memberSaving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>

      {/* 部门 Modal */}
      <Modal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} title={editingDept ? '编辑部门' : '添加部门'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="部门名称 *" placeholder="如：技术部" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} />
          <div>
            <label style={labelStyle}>上级部门</label>
            <select value={deptForm.parent_id} onChange={e => setDeptForm({ ...deptForm, parent_id: e.target.value })} style={selectStyle}>
              <option value="">无（顶级部门）</option>
              {departments.filter((d: any) => !editingDept || d.id !== editingDept.id).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setDeptModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveDept} disabled={deptSaving}>{deptSaving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
