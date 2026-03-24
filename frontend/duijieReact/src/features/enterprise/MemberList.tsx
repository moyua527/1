import { Phone, Mail, Building, Edit3, X, Calendar, GitBranch, UserPlus, Shield, Crown } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { section, roleConfig } from './constants'

interface Props {
  members: any[]
  departments: any[]
  isOwner: boolean
  canAdmin: boolean
  getDeptName: (id: number | null) => string
  openAddMember: () => void
  openEditMember: (m: any) => void
  handleDeleteMember: (id: number) => void
  handleRoleChange: (memberId: number, role: string) => void
}

export default function MemberList({ members, departments, isOwner, canAdmin, getDeptName, openAddMember, openEditMember, handleDeleteMember, handleRoleChange }: Props) {
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
            const rc = roleConfig[mRole] || roleConfig.member
            return (
            <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, borderLeft: mRole === 'creator' ? '3px solid #9333ea' : mRole === 'admin' ? '3px solid #2563eb' : '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Avatar name={m.name} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: rc.bg, color: rc.color, fontWeight: 600 }}>
                      {mRole === 'creator' && <Crown size={9} style={{ marginRight: 2, verticalAlign: -1 }} />}
                      {mRole === 'admin' && <Shield size={9} style={{ marginRight: 2, verticalAlign: -1 }} />}
                      {rc.label}
                    </span>
                    {m.employee_id && <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>#{m.employee_id}</span>}
                  </div>
                  {m.position && <div style={{ fontSize: 12, color: '#64748b' }}>{m.position}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {isOwner && mRole !== 'creator' && (
                    <select value={mRole} onChange={e => handleRoleChange(m.id, e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', outline: 'none', cursor: 'pointer', background: '#fff' }}>
                      <option value="admin">管理员</option>
                      <option value="member">成员</option>
                    </select>
                  )}
                  {canAdmin && mRole !== 'creator' && (
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
    </div>
  )
}
