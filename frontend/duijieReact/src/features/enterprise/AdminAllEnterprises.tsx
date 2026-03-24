import { Building2, Building, Phone, Mail, MapPin, Users, Hash, Calendar, Globe, Briefcase, FileText, ChevronRight, ChevronDown, Eye, Shield, Crown } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { section, infoRow, roleConfig } from './constants'

interface Props {
  allEnterprises: any[]
  expandedEntId: number | null
  setExpandedEntId: (id: number | null) => void
}

export default function AdminAllEnterprises({ allEnterprises, expandedEntId, setExpandedEntId }: Props) {
  if (allEnterprises.length === 0) return null
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Eye size={18} color="#64748b" /> 所有企业 <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>（系统管理员视角，仅查看）</span>
      </h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px 0' }}>共 {allEnterprises.length} 家企业</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allEnterprises.map((item: any) => {
          const e = item.enterprise
          const ms = item.members || []
          const ds = item.departments || []
          const isExpanded = expandedEntId === e.id
          const getDName = (id: number) => ds.find((d: any) => d.id === id)?.name || ''
          return (
            <div key={e.id} style={{ ...section, padding: 0, overflow: 'hidden' }}>
              <div onClick={() => setExpandedEntId(isExpanded ? null : e.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff' }}>
                {isExpanded ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={20} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{e.name}</span>
                    {e.company_type && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#e0e7ff', color: '#3730a3' }}>{e.company_type}</span>}
                    {e.industry && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: '#15803d' }}>{e.industry}</span>}
                  </div>
                  {e.company && <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{e.company}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}><Users size={12} style={{ verticalAlign: -2, marginRight: 3 }} />{ms.length}人</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}><Building size={12} style={{ verticalAlign: -2, marginRight: 3 }} />{ds.length}部门</span>
                  {e.creator_name && <span style={{ fontSize: 11, color: '#9333ea', background: '#f3e8ff', padding: '1px 6px', borderRadius: 4 }}>创建者: {e.creator_name}</span>}
                </div>
              </div>
              {isExpanded && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2px 24px', marginBottom: 12 }}>
                    {e.credit_code && <div style={infoRow}><Hash size={14} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>信用代码</span> <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.credit_code}</span></div>}
                    {e.legal_person && <div style={infoRow}><Users size={14} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>法人</span> {e.legal_person}</div>}
                    {e.registered_capital && <div style={infoRow}><FileText size={14} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>注册资本</span> {e.registered_capital}</div>}
                    {e.established_date && <div style={infoRow}><Calendar size={14} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>成立</span> {e.established_date.slice(0, 10)}</div>}
                    {e.phone && <div style={infoRow}><Phone size={14} color="#64748b" /> {e.phone}</div>}
                    {e.email && <div style={infoRow}><Mail size={14} color="#64748b" /> {e.email}</div>}
                    {e.address && <div style={infoRow}><MapPin size={14} color="#64748b" /> {e.address}</div>}
                    {e.website && <div style={infoRow}><Globe size={14} color="#64748b" /> {e.website}</div>}
                    {e.scale && <div style={infoRow}><Briefcase size={14} color="#64748b" /> {e.scale}</div>}
                  </div>
                  {ms.length > 0 && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>成员 ({ms.length})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                        {ms.map((m: any) => {
                          const mRole = m.role || 'member'
                          const rc = roleConfig[mRole] || roleConfig.member
                          return (
                            <div key={m.id} style={{ border: '1px solid #f1f5f9', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 8, borderLeft: mRole === 'creator' ? '3px solid #9333ea' : mRole === 'admin' ? '3px solid #2563eb' : '1px solid #f1f5f9' }}>
                              <Avatar name={m.name} size={32} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                                  <span style={{ fontSize: 9, padding: '0px 5px', borderRadius: 3, background: rc.bg, color: rc.color, fontWeight: 600 }}>
                                    {mRole === 'creator' && <Crown size={8} style={{ marginRight: 2, verticalAlign: -1 }} />}
                                    {mRole === 'admin' && <Shield size={8} style={{ marginRight: 2, verticalAlign: -1 }} />}
                                    {rc.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {m.position && <span>{m.position}</span>}
                                  {m.department_id && <span>· {getDName(m.department_id)}</span>}
                                  {m.phone && <span>· {m.phone}</span>}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
