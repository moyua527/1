import { Building2, Phone, Mail, MapPin, Clock, Briefcase, FileText, Edit3, Trash2, Hash, Calendar, Globe, MoreHorizontal, Shield, Crown, Users } from 'lucide-react'
import { section, infoRow, roleConfig } from './constants'

interface Props {
  ent: any
  myRole: string
  isOwner: boolean
  entMenuOpen: boolean
  setEntMenuOpen: (v: boolean) => void
  openEditEnt: () => void
  handleDeleteEnterprise: () => void
}

export default function EnterpriseCard({ ent, myRole, isOwner, entMenuOpen, setEntMenuOpen, openEditEnt, handleDeleteEnterprise }: Props) {
  return (
    <div style={section}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={28} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{ent.name}</span>
            {ent.company_type && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#e0e7ff', color: '#3730a3', fontWeight: 500 }}>{ent.company_type}</span>}
            {ent.industry && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>{ent.industry}</span>}
            {ent.scale && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontWeight: 500 }}>{ent.scale}</span>}
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: roleConfig[myRole]?.bg, color: roleConfig[myRole]?.color, fontWeight: 600 }}>
              {myRole === 'creator' && <Crown size={10} style={{ marginRight: 3, verticalAlign: -1 }} />}
              {myRole === 'admin' && <Shield size={10} style={{ marginRight: 3, verticalAlign: -1 }} />}
              {roleConfig[myRole]?.label}
            </span>
          </div>
          {ent.company && <div style={{ fontSize: 14, color: '#64748b' }}>{ent.company}</div>}
        </div>
        {isOwner && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setEntMenuOpen(!entMenuOpen)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}>
              <MoreHorizontal size={18} />
            </button>
            {entMenuOpen && (
              <>
                <div onClick={() => setEntMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 50, minWidth: 120, overflow: 'hidden' }}>
                  <button onClick={() => { setEntMenuOpen(false); openEditEnt() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#334155' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Edit3 size={14} color="#2563eb" /> 编辑企业
                  </button>
                  <div style={{ height: 1, background: '#f1f5f9' }} />
                  <button onClick={() => { setEntMenuOpen(false); handleDeleteEnterprise() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc2626' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Trash2 size={14} /> 删除企业
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '4px 24px' }}>
        {ent.credit_code && <div style={infoRow}><Hash size={16} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>统一社会信用代码</span> <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{ent.credit_code}</span></div>}
        {ent.legal_person && <div style={infoRow}><Users size={16} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>法定代表人</span> {ent.legal_person}</div>}
        {ent.registered_capital && <div style={infoRow}><FileText size={16} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>注册资本</span> {ent.registered_capital}</div>}
        {ent.established_date && <div style={infoRow}><Calendar size={16} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>成立日期</span> {ent.established_date.slice(0, 10)}</div>}
        {ent.email && <div style={infoRow}><Mail size={16} color="#64748b" /> {ent.email}</div>}
        {ent.phone && <div style={infoRow}><Phone size={16} color="#64748b" /> {ent.phone}</div>}
        {ent.address && <div style={infoRow}><MapPin size={16} color="#64748b" /> {ent.address}</div>}
        {ent.website && <div style={infoRow}><Globe size={16} color="#64748b" /> <a href={ent.website.startsWith('http') ? ent.website : `https://${ent.website}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{ent.website}</a></div>}
        {ent.business_scope && <div style={{ ...infoRow, gridColumn: '1 / -1' }}><Briefcase size={16} color="#64748b" /> <span style={{ color: '#94a3b8', fontSize: 12 }}>经营范围</span> <span style={{ flex: 1 }}>{ent.business_scope}</span></div>}
        {ent.notes && <div style={{ ...infoRow, gridColumn: '1 / -1' }}><FileText size={16} color="#64748b" /> {ent.notes}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          <Clock size={12} /> 创建于 {new Date(ent.created_at).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  )
}
