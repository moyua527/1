import { useState } from 'react'
import { Phone, Mail, Building, Edit3, X, Calendar, GitBranch, UserPlus, Shield, Crown, Hash, User, Briefcase, FileText, KeyRound } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { section, creatorRoleConfig } from './constants'

interface Props {
  members: any[]
  departments: any[]
  roles?: any[]
  isOwner: boolean
  canAdmin: boolean
  getDeptName: (id: number | null) => string
  getRoleName?: (roleId: number | null) => string
  getRoleColor?: (roleId: number | null) => string
  openAddMember: () => void
  openEditMember: (m: any) => void
  handleDeleteMember: (id: number) => void
  handleRoleChange: (memberId: number, role: string) => void
  handleAssignRole?: (memberId: number, roleId: number | null) => void
}

const detailRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }
const detailLabel: React.CSSProperties = { fontSize: 13, color: '#94a3b8', minWidth: 72, flexShrink: 0 }
const detailValue: React.CSSProperties = { fontSize: 14, color: '#0f172a', fontWeight: 500, wordBreak: 'break-all' }

export default function MemberList({ members, departments, roles = [], isOwner, canAdmin, getDeptName, getRoleName, getRoleColor, openAddMember, openEditMember, handleDeleteMember, handleRoleChange, handleAssignRole }: Props) {
  const [viewingMember, setViewingMember] = useState<any>(null)

  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
      {canAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={openAddMember}><UserPlus size={14} /> 添加成员</Button>
        </div>
      )}
      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无组织成员，点击"添加成员"开始</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {members.map((m: any) => {
            const mRole = m.role || 'member'
            const isCreatorMember = mRole === 'creator'
            const customRoleName = getRoleName?.(m.enterprise_role_id)
            const customRoleColor = getRoleColor?.(m.enterprise_role_id)
            const borderColor = isCreatorMember ? '#9333ea' : customRoleName ? customRoleColor : '#e2e8f0'
            return (
            <div key={m.id} onClick={() => setViewingMember(m)}
              style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s',
                borderLeft: `3px solid ${borderColor}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#cbd5e1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Avatar name={m.name} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                    {isCreatorMember && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: creatorRoleConfig.bg, color: creatorRoleConfig.color, fontWeight: 600 }}>
                        <Crown size={9} style={{ marginRight: 2, verticalAlign: -1 }} />{creatorRoleConfig.label}
                      </span>
                    )}
                    {customRoleName && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: customRoleColor + '18', color: customRoleColor, fontWeight: 600 }}>
                        <KeyRound size={9} style={{ marginRight: 2, verticalAlign: -1 }} />{customRoleName}
                      </span>
                    )}
                    {!isCreatorMember && !customRoleName && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', color: '#94a3b8', fontWeight: 600 }}>未分配角色</span>
                    )}
                    {m.employee_id && <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>#{m.employee_id}</span>}
                  </div>
                  {m.position && <div style={{ fontSize: 12, color: '#64748b' }}>{m.position}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  {canAdmin && !isCreatorMember && roles.length > 0 && (
                    <select value={m.enterprise_role_id || ''} onChange={e => handleAssignRole?.(m.id, e.target.value ? Number(e.target.value) : null)}
                      style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', outline: 'none', cursor: 'pointer', background: '#fff', maxWidth: 90 }}>
                      <option value="">无角色</option>
                      {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}
                  {canAdmin && !isCreatorMember && (
                    <>
                      <button onClick={() => openEditMember(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                      <button onClick={() => handleDeleteMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><X size={13} /></button>
                    </>
                  )}
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
            )
          })}
        </div>
      )}

      {/* 成员详情弹窗 */}
      <Modal open={!!viewingMember} onClose={() => setViewingMember(null)} title="成员信息">
        {viewingMember && (() => {
          const mRole = viewingMember.role || 'member'
          const isCreatorM = mRole === 'creator'
          const vRoleName = getRoleName?.(viewingMember.enterprise_role_id)
          const vRoleColor = getRoleColor?.(viewingMember.enterprise_role_id)
          const deptName = getDeptName(viewingMember.department_id) || viewingMember.department || ''
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid #e2e8f0', marginBottom: 4 }}>
                <Avatar name={viewingMember.name} size={56} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{viewingMember.name}</span>
                    {isCreatorM && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: creatorRoleConfig.bg, color: creatorRoleConfig.color, fontWeight: 600 }}>
                        <Crown size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{creatorRoleConfig.label}
                      </span>
                    )}
                    {vRoleName && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: vRoleColor + '18', color: vRoleColor, fontWeight: 600 }}>
                        <KeyRound size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{vRoleName}
                      </span>
                    )}
                  </div>
                  {viewingMember.position && <div style={{ fontSize: 14, color: '#64748b' }}>{viewingMember.position}</div>}
                </div>
              </div>

              <div>
                {viewingMember.employee_id && (
                  <div style={detailRow}>
                    <Hash size={15} color="#94a3b8" />
                    <span style={detailLabel}>工号</span>
                    <span style={detailValue}>{viewingMember.employee_id}</span>
                  </div>
                )}
                {deptName && (
                  <div style={detailRow}>
                    <Building size={15} color="#94a3b8" />
                    <span style={detailLabel}>部门</span>
                    <span style={detailValue}>{deptName}</span>
                  </div>
                )}
                {viewingMember.phone && (
                  <div style={detailRow}>
                    <Phone size={15} color="#94a3b8" />
                    <span style={detailLabel}>电话</span>
                    <span style={detailValue}>{viewingMember.phone}</span>
                  </div>
                )}
                {viewingMember.email && (
                  <div style={detailRow}>
                    <Mail size={15} color="#94a3b8" />
                    <span style={detailLabel}>邮箱</span>
                    <span style={detailValue}>{viewingMember.email}</span>
                  </div>
                )}
                {viewingMember.supervisor && (
                  <div style={detailRow}>
                    <User size={15} color="#94a3b8" />
                    <span style={detailLabel}>直属上级</span>
                    <span style={detailValue}>{viewingMember.supervisor}</span>
                  </div>
                )}
                {viewingMember.join_date && (
                  <div style={detailRow}>
                    <Calendar size={15} color="#94a3b8" />
                    <span style={detailLabel}>入职日期</span>
                    <span style={detailValue}>{viewingMember.join_date.slice(0, 10)}</span>
                  </div>
                )}
                {viewingMember.notes && (
                  <div style={{ ...detailRow, borderBottom: 'none', alignItems: 'flex-start' }}>
                    <FileText size={15} color="#94a3b8" style={{ marginTop: 2 }} />
                    <span style={detailLabel}>备注</span>
                    <span style={{ ...detailValue, fontWeight: 400, color: '#334155', whiteSpace: 'pre-wrap' }}>{viewingMember.notes}</span>
                  </div>
                )}
                {!viewingMember.employee_id && !deptName && !viewingMember.phone && !viewingMember.email && !viewingMember.supervisor && !viewingMember.join_date && !viewingMember.notes && (
                  <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无更多信息</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                {canAdmin && !isCreatorM && (
                  <Button variant="secondary" onClick={() => { setViewingMember(null); openEditMember(viewingMember) }}>编辑</Button>
                )}
                <Button onClick={() => setViewingMember(null)}>关闭</Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
