import { useState, useEffect } from 'react'
import { Building2, Building, Phone, Mail, Users, MapPin, Clock, Briefcase, FileText, Edit3, UserPlus, X, Save } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

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
  const [editEntOpen, setEditEntOpen] = useState(false)
  const [entForm, setEntForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' })
  const [entSaving, setEntSaving] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [memberForm, setMemberForm] = useState({ name: '', position: '', department: '', phone: '', email: '', notes: '' })
  const [memberSaving, setMemberSaving] = useState(false)

  const load = () => {
    fetchApi('/api/my-enterprise').then(r => {
      if (r.success) setData(r.data)
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const openEditEnt = () => {
    if (!data) return
    const e = data.enterprise
    setEntForm({ name: e.name || '', company: e.company || '', email: e.email || '', phone: e.phone || '', notes: e.notes || '' })
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

  const openAddMember = () => {
    setEditingMember(null)
    setMemberForm({ name: '', position: '', department: '', phone: '', email: '', notes: '' })
    setMemberModalOpen(true)
  }
  const openEditMember = (m: any) => {
    setEditingMember(m)
    setMemberForm({ name: m.name || '', position: m.position || '', department: m.department || '', phone: m.phone || '', email: m.email || '', notes: m.notes || '' })
    setMemberModalOpen(true)
  }
  const handleSaveMember = async () => {
    if (!memberForm.name.trim()) { toast('请输入成员姓名', 'error'); return }
    setMemberSaving(true)
    const r = editingMember
      ? await fetchApi(`/api/my-enterprise/members/${editingMember.id}`, { method: 'PUT', body: JSON.stringify(memberForm) })
      : await fetchApi('/api/my-enterprise/members', { method: 'POST', body: JSON.stringify(memberForm) })
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
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 0 }}>管理企业信息与组织成员</p>

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
          <button onClick={openEditEnt} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#2563eb' }}>
            <Edit3 size={14} /> 编辑
          </button>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#0284c7" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>组织成员</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>({members.length})</span>
          </div>
          <Button onClick={openAddMember}><UserPlus size={14} /> 添加成员</Button>
        </div>
        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无组织成员，点击"添加成员"开始</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {members.map((m: any) => (
              <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Avatar name={m.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{m.name}</div>
                    {m.position && <div style={{ fontSize: 12, color: '#64748b' }}>{m.position}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEditMember(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                    <button onClick={() => handleDeleteMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><X size={13} /></button>
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

      <Modal open={editEntOpen} onClose={() => setEditEntOpen(false)} title="编辑企业信息">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="企业名称 *" value={entForm.name} onChange={e => setEntForm({ ...entForm, name: e.target.value })} />
          <Input label="公司全称" placeholder="如：XX科技有限公司" value={entForm.company} onChange={e => setEntForm({ ...entForm, company: e.target.value })} />
          <Input label="邮箱" value={entForm.email} onChange={e => setEntForm({ ...entForm, email: e.target.value })} />
          <Input label="电话" value={entForm.phone} onChange={e => setEntForm({ ...entForm, phone: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
            <textarea value={entForm.notes} onChange={e => setEntForm({ ...entForm, notes: e.target.value })} rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setEditEntOpen(false)}>取消</Button>
            <Button onClick={handleSaveEnt} disabled={entSaving}>{entSaving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={memberModalOpen} onClose={() => setMemberModalOpen(false)} title={editingMember ? '编辑成员' : '添加成员'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="姓名 *" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} />
          <Input label="职位" placeholder="如：技术总监" value={memberForm.position} onChange={e => setMemberForm({ ...memberForm, position: e.target.value })} />
          <Input label="部门" placeholder="如：技术部" value={memberForm.department} onChange={e => setMemberForm({ ...memberForm, department: e.target.value })} />
          <Input label="电话" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} />
          <Input label="邮箱" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
            <textarea value={memberForm.notes} onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })} rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setMemberModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveMember} disabled={memberSaving}>{memberSaving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
