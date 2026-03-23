import { useState, useEffect } from 'react'
import { Building2, Building, Phone, Mail, Users, MapPin, Clock, Briefcase, FileText } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import Avatar from '../ui/Avatar'

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }
const infoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', padding: '6px 0' }

const stageMap: Record<string, { label: string; color: string; bg: string }> = {
  potential: { label: '潜在', color: '#6b7280', bg: '#f3f4f6' },
  contacted: { label: '已联系', color: '#2563eb', bg: '#dbeafe' },
  negotiating: { label: '谈判中', color: '#d97706', bg: '#fef3c7' },
  signed: { label: '已签约', color: '#16a34a', bg: '#dcfce7' },
  churned: { label: '已流失', color: '#dc2626', bg: '#fef2f2' },
}

export default function Enterprise() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi('/api/my-enterprise').then(r => {
      if (r.success) setData(r.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  if (!data) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Building2 size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>暂未关联企业</div>
      <div style={{ fontSize: 14, color: '#94a3b8' }}>您的账号尚未关联到企业客户，请联系管理员进行关联</div>
    </div>
  )

  const { enterprise: ent, members } = data
  const stage = stageMap[ent.stage] || stageMap.potential

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>企业管理</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 0 }}>查看企业信息与组织成员</p>

      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={28} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{ent.name}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#dbeafe', color: '#1e40af', fontWeight: 500 }}>企业</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: stage.bg, color: stage.color, fontWeight: 500 }}>{stage.label}</span>
            </div>
            {ent.company && <div style={{ fontSize: 14, color: '#64748b' }}>{ent.company}</div>}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
          {ent.company && <div style={infoRow}><Building size={16} color="#64748b" /> {ent.company}</div>}
          {ent.email && <div style={infoRow}><Mail size={16} color="#64748b" /> {ent.email}</div>}
          {ent.phone && <div style={infoRow}><Phone size={16} color="#64748b" /> {ent.phone}</div>}
          {ent.channel && <div style={infoRow}><MapPin size={16} color="#2563eb" /> <span style={{ color: '#2563eb', fontWeight: 500 }}>{ent.channel}</span></div>}
          {ent.department && <div style={infoRow}><Building size={16} color="#0284c7" /> 部门: {ent.department}</div>}
          {ent.position_level && <div style={infoRow}><Briefcase size={16} color="#7c3aed" /> 职位: {ent.position_level}</div>}
          {ent.notes && <div style={infoRow}><FileText size={16} color="#64748b" /> {ent.notes}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            <Clock size={12} /> 创建于 {new Date(ent.created_at).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      <div style={{ ...section, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Users size={18} color="#0284c7" />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>组织成员</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>({members.length})</span>
        </div>
        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无组织成员</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {members.map((m: any) => (
              <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Avatar name={m.name} size={36} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{m.name}</div>
                    {m.position && <div style={{ fontSize: 12, color: '#64748b' }}>{m.position}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {m.department && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><Building size={12} color="#94a3b8" />{m.department}</div>}
                  {m.phone && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} color="#94a3b8" />{m.phone}</div>}
                  {m.email && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} color="#94a3b8" />{m.email}</div>}
                </div>
                {m.notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{m.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
