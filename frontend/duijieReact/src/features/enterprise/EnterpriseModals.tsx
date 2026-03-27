import { useState } from 'react'
import { Search, Plus, ChevronDown, ChevronUp, Check, X as XIcon } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import useIsMobile from '../ui/useIsMobile'
import { labelStyle, selectStyle, textareaStyle, industryOptions, scaleOptions, companyTypeOptions, ENTERPRISE_PERMISSIONS, ROLE_COLORS, emptyRoleForm } from './constants'

interface Props {
  // 编辑企业
  editEntOpen: boolean
  setEditEntOpen: (v: boolean) => void
  entForm: any
  setEntForm: (v: any) => void
  entSaving: boolean
  handleSaveEnt: () => void
  // 成员
  memberModalOpen: boolean
  setMemberModalOpen: (v: boolean) => void
  editingMember: any
  memberForm: any
  setMemberForm: (v: any) => void
  memberSaving: boolean
  handleSaveMember: () => void
  lookupPhone: string
  setLookupPhone: (v: string) => void
  lookupLoading: boolean
  handleLookup: () => void
  departments: any[]
  roles: any[]
  onCreateRole: (form: any) => Promise<number | null>
  // 部门
  deptModalOpen: boolean
  setDeptModalOpen: (v: boolean) => void
  editingDept: any
  deptForm: any
  setDeptForm: (v: any) => void
  deptSaving: boolean
  handleSaveDept: () => void
}

export default function EnterpriseModals(props: Props) {
  const {
    editEntOpen, setEditEntOpen, entForm, setEntForm, entSaving, handleSaveEnt,
    memberModalOpen, setMemberModalOpen, editingMember, memberForm, setMemberForm, memberSaving, handleSaveMember,
    lookupPhone, setLookupPhone, lookupLoading, handleLookup, departments, roles, onCreateRole,
    deptModalOpen, setDeptModalOpen, editingDept, deptForm, setDeptForm, deptSaving, handleSaveDept,
  } = props

  const [showRoleForm, setShowRoleForm] = useState(false)
  const [roleForm, setRoleForm] = useState({ ...emptyRoleForm })
  const [creatingSaving, setCreatingSaving] = useState(false)
  const isMobile = useIsMobile()
  const memberGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }
  const memberActionStyle: React.CSSProperties = { display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: 8 }
  const memberButtonStyle = isMobile ? { width: '100%', justifyContent: 'center' } : undefined

  const handleCreateRoleInline = async () => {
    if (!roleForm.name.trim() || creatingSaving) return
    setCreatingSaving(true)
    const newId = await onCreateRole(roleForm)
    setCreatingSaving(false)
    if (newId) {
      setMemberForm({ ...memberForm, enterprise_role_id: String(newId), position: roleForm.name.trim() })
      setRoleForm({ ...emptyRoleForm })
      setShowRoleForm(false)
    }
  }

  return (
    <>
      {/* 编辑企业 Modal */}
      <Modal open={editEntOpen} onClose={() => setEditEntOpen(false)} title="编辑企业信息">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>基本信息</div>
          <Input label="企业名称 *" value={entForm.name} onChange={e => setEntForm({ ...entForm, name: e.target.value })} />
          <Input label="公司全称" placeholder="如：XX科技有限公司" value={entForm.company} onChange={e => setEntForm({ ...entForm, company: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>企业类型</label>
              <select value={entForm.company_type} onChange={e => setEntForm({ ...entForm, company_type: e.target.value })} style={selectStyle}>
                <option value="">请选择企业类型</option>
                {companyTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>行业</label>
              <select value={entForm.industry} onChange={e => setEntForm({ ...entForm, industry: e.target.value })} style={selectStyle}>
                <option value="">请选择行业</option>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>规模</label>
              <select value={entForm.scale} onChange={e => setEntForm({ ...entForm, scale: e.target.value })} style={selectStyle}>
                <option value="">请选择规模</option>
                {scaleOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="成立日期" type="date" value={entForm.established_date} onChange={e => setEntForm({ ...entForm, established_date: e.target.value })} />
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginTop: 4 }}>工商信息</div>
          <Input label="统一社会信用代码" placeholder="18位信用代码" maxLength={18} value={entForm.credit_code} onChange={e => setEntForm({ ...entForm, credit_code: e.target.value.toUpperCase() })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="法定代表人" placeholder="法人姓名" value={entForm.legal_person} onChange={e => setEntForm({ ...entForm, legal_person: e.target.value })} />
            <Input label="注册资本" placeholder="如：100万元人民币" value={entForm.registered_capital} onChange={e => setEntForm({ ...entForm, registered_capital: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>经营范围</label>
            <textarea value={entForm.business_scope} onChange={e => setEntForm({ ...entForm, business_scope: e.target.value })} rows={3} placeholder="主营业务范围" style={textareaStyle} />
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginTop: 4 }}>联系方式</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="邮箱" value={entForm.email} onChange={e => setEntForm({ ...entForm, email: e.target.value })} />
            <Input label="电话" maxLength={11} value={entForm.phone} onChange={e => setEntForm({ ...entForm, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
          </div>
          <Input label="地址" value={entForm.address} onChange={e => setEntForm({ ...entForm, address: e.target.value })} />
          <Input label="官网" placeholder="如：www.example.com" value={entForm.website} onChange={e => setEntForm({ ...entForm, website: e.target.value })} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: isMobile ? 0 : 4 }}>
          {!editingMember && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>从已有账号导入</label>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
                <input value={lookupPhone} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setLookupPhone(v) }} placeholder="输入手机号查找" maxLength={11}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
                <button onClick={handleLookup} disabled={lookupLoading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 13, fontWeight: 500, opacity: lookupLoading ? 0.6 : 1, width: isMobile ? '100%' : undefined }}>
                  <Search size={14} /> {lookupLoading ? '查找中...' : '导入'}
                </button>
              </div>
            </div>
          )}
          <div style={memberGridStyle}>
            <Input label="姓名 *" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} />
            <Input label="工号" placeholder="如：E001" value={memberForm.employee_id} onChange={e => setMemberForm({ ...memberForm, employee_id: e.target.value })} />
          </div>
          <div style={memberGridStyle}>
            <div>
              <label style={labelStyle}>角色 / 职位</label>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 6 }}>
                <select value={memberForm.enterprise_role_id || ''} onChange={e => {
                  const roleId = e.target.value
                  const role = roles.find((r: any) => String(r.id) === roleId)
                  setMemberForm({ ...memberForm, enterprise_role_id: roleId, position: role?.name || '' })
                }} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">未分配</option>
                  {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button onClick={() => { setShowRoleForm(!showRoleForm); if (!showRoleForm) setRoleForm({ ...emptyRoleForm }) }}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: showRoleForm ? '#eff6ff' : '#fff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0, width: isMobile ? '100%' : undefined }}>
                  <Plus size={13} />新增
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>所属部门</label>
              <select value={memberForm.department_id} onChange={e => setMemberForm({ ...memberForm, department_id: e.target.value })} style={selectStyle}>
                <option value="">未分配</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.parent_id ? '　└ ' : ''}{d.name}</option>)}
              </select>
            </div>
          </div>
          {showRoleForm && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>新建角色</span>
                <button onClick={() => setShowRoleForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}><XIcon size={14} /></button>
              </div>
              <Input label="角色名称 *" placeholder="如：项目经理、技术总监" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} />
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 6 }}>角色颜色</label>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {ROLE_COLORS.map(c => (
                    <button key={c} onClick={() => setRoleForm({ ...roleForm, color: c })}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: roleForm.color === c ? '3px solid #0f172a' : '2px solid #e2e8f0', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 6 }}>权限设置</label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
                  {ENTERPRISE_PERMISSIONS.map(p => (
                    <label key={p.key} onClick={() => setRoleForm({ ...roleForm, [p.key]: !(roleForm as any)[p.key] })}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, border: '1px solid #e2e8f0', background: (roleForm as any)[p.key] ? '#f0fdf4' : '#fff' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: (roleForm as any)[p.key] ? 'none' : '1.5px solid #cbd5e1', background: (roleForm as any)[p.key] ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {(roleForm as any)[p.key] && <Check size={10} color="#fff" />}
                      </div>
                      <span style={{ color: '#334155' }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ ...memberActionStyle, marginTop: 12 }}>
                <Button variant="secondary" onClick={() => setShowRoleForm(false)} style={memberButtonStyle}>取消</Button>
                <Button onClick={handleCreateRoleInline} disabled={creatingSaving || !roleForm.name.trim()} style={memberButtonStyle}>
                  {creatingSaving ? '创建中...' : '创建并选择'}
                </Button>
              </div>
            </div>
          )}
          <div style={memberGridStyle}>
            <Input label="电话" value={memberForm.phone} maxLength={11} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
            <Input label="邮箱" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} />
          </div>
          <div style={memberGridStyle}>
            <Input label="直属上级" placeholder="上级姓名" value={memberForm.supervisor} onChange={e => setMemberForm({ ...memberForm, supervisor: e.target.value })} />
            <Input label="入职日期" type="date" value={memberForm.join_date} onChange={e => setMemberForm({ ...memberForm, join_date: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>备注</label>
            <textarea value={memberForm.notes} onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })} rows={2} style={textareaStyle} />
          </div>
          <div style={memberActionStyle}>
            <Button variant="secondary" onClick={() => setMemberModalOpen(false)} style={memberButtonStyle}>取消</Button>
            <Button onClick={handleSaveMember} disabled={memberSaving} style={memberButtonStyle}>{memberSaving ? '保存中...' : '保存'}</Button>
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
    </>
  )
}
