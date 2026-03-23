import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Tag, Building, Mail, Phone, FileText, Clock, MoreVertical, Settings, History, Trash2, MessageSquare, Plus, PhoneCall, Send, MapPin, AtSign, HelpCircle, UserPlus, Users, Star, Edit3, X, FileSignature, DollarSign, Zap, Sparkles, Loader2, Building2, UserCircle } from 'lucide-react'
import { clientApi } from '../services/api'
import Avatar from '../../ui/Avatar'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const infoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 14, color: '#334155' }
const channels = ['Boss直聘', '微信', '抖音', '小红书', '淘宝', '拼多多', '线下推荐', '其他']
const positionLevels = ['C级高管', '副总裁/VP', '总监', '经理', '主管', '专员', '其他']
const departments = ['总经办', '销售部', '市场部', '技术部', '产品部', '运营部', '人力资源', '财务部', '采购部', '客服部', '其他']
const jobFunctions = ['决策者', '影响者', '使用者', '采购者', '技术评估', '项目管理', '其他']
const fieldLabel: Record<string, string> = { channel: '渠道', name: '名称', company: '公司', email: '邮箱', phone: '电话', stage: '阶段', notes: '备注', position_level: '职位级别', department: '部门', job_function: '工作职能' }
const followTypeMap: Record<string, { label: string; icon: string }> = {
  phone: { label: '电话', icon: 'phone' },
  wechat: { label: '微信', icon: 'message' },
  visit: { label: '拜访', icon: 'map' },
  email: { label: '邮件', icon: 'mail' },
  other: { label: '其他', icon: 'help' },
}

const stageMap: Record<string, { label: string; color: string; bg: string }> = {
  potential: { label: '潜在', color: '#6b7280', bg: '#f3f4f6' },
  intent: { label: '意向', color: '#2563eb', bg: '#eff6ff' },
  signed: { label: '签约', color: '#7c3aed', bg: '#f5f3ff' },
  active: { label: '合作中', color: '#16a34a', bg: '#f0fdf4' },
  lost: { label: '流失', color: '#dc2626', bg: '#fef2f2' },
}

export default function ClientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [form, setForm] = useState({ client_type: 'company', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', notes: '', position_level: '', department: '', job_function: '', assigned_to: '' })
  const [saving, setSaving] = useState(false)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const menuRef = useRef<HTMLDivElement>(null)
  const [followUps, setFollowUps] = useState<any[]>([])
  const [showFollowForm, setShowFollowForm] = useState(false)
  const [followForm, setFollowForm] = useState({ content: '', follow_type: 'phone', next_follow_date: '' })
  const [followSubmitting, setFollowSubmitting] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [contactForm, setContactForm] = useState({ name: '', position: '', phone: '', email: '', wechat: '', is_primary: false, notes: '' })
  const [contactSaving, setContactSaving] = useState(false)
  const [score, setScore] = useState<any>(null)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [allTags, setAllTags] = useState<any[]>([])
  const [clientTags, setClientTags] = useState<any[]>([])
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6b7280')
  const [contracts, setContracts] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<any>(null)
  const [contractForm, setContractForm] = useState({ title: '', amount: '', status: 'draft', signed_date: '', expire_date: '', notes: '' })
  const [contractSaving, setContractSaving] = useState(false)

  const load = () => {
    if (!id) return
    clientApi.detail(id).then(r => { if (r.success) setClient(r.data) })
    clientApi.followUps(id).then(r => { if (r.success) setFollowUps(r.data || []) })
    clientApi.contacts(id).then(r => { if (r.success) setContacts(r.data || []) })
    clientApi.clientTags(id).then(r => { if (r.success) setClientTags(r.data || []) })
    clientApi.contracts(id).then(r => { if (r.success) setContracts(r.data || []) })
    clientApi.score(id).then(r => { if (r.success) setScore(r.data) })
  }
  useEffect(load, [id])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openEdit = () => {
    setForm({ client_type: client.client_type || 'company', name: client.name || '', company: client.company || '', email: client.email || '', phone: client.phone || '', channel: client.channel || '', stage: client.stage || 'potential', notes: client.notes || '', position_level: client.position_level || '', department: client.department || '', job_function: client.job_function || '', assigned_to: client.assigned_to ? String(client.assigned_to) : '' })
    clientApi.availableMembers().then(r => { if (r.success) setStaffMembers((r.data || []).filter((u: any) => ['admin', 'business', 'tech'].includes(u.role))) })
    setEditOpen(true); setMenuOpen(false)
  }

  const openHistory = async () => {
    setMenuOpen(false)
    const r = await clientApi.logs(id!)
    if (r.success) setLogs(r.data || [])
    setHistoryOpen(true)
  }

  const handleSave = async () => {
    const e: Record<string, string> = {}
    if (!form.channel) e.channel = '请选择渠道'
    if (!form.name.trim()) e.name = '请输入客户名称'
    if (form.client_type === 'company' && !form.company.trim()) e.company = '请输入公司名称'
    if (!form.email.trim()) e.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = '邮箱格式不正确'
    if (!form.phone.trim()) e.phone = '请输入电话'
    else if (!/^1[3-9]\d{9}$/.test(form.phone.trim()) && !/^\d{7,15}$/.test(form.phone.trim().replace(/[-\s]/g, ''))) e.phone = '电话格式不正确'
    if (!form.position_level) e.position_level = '请选择职位级别'
    if (!form.department) e.department = '请选择部门'
    if (!form.job_function) e.job_function = '请选择工作职能'
    setEditErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    const r = await clientApi.update(id!, form)
    setSaving(false)
    if (r.success) { toast('保存成功', 'success'); setEditOpen(false); load() }
    else toast(r.message || '保存失败', 'error')
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    if (!(await confirm({ message: '确定删除此客户？删除后不可恢复。', danger: true }))) return
    const r = await clientApi.remove(id!)
    if (r.success) { toast('客户已删除', 'success'); nav('/clients') }
    else toast(r.message || '删除失败', 'error')
  }

  const handleCreateFollow = async () => {
    if (!followForm.content.trim()) { toast('请输入跟进内容', 'error'); return }
    setFollowSubmitting(true)
    const r = await clientApi.createFollowUp({ client_id: Number(id), ...followForm })
    setFollowSubmitting(false)
    if (r.success) { toast('跟进记录已添加', 'success'); setShowFollowForm(false); setFollowForm({ content: '', follow_type: 'phone', next_follow_date: '' }); load() }
    else toast(r.message || '添加失败', 'error')
  }

  const startEditFollowUp = (f: any) => {
    setEditingFollowUp(f)
    setFollowForm({ content: f.content || '', follow_type: f.follow_type || 'phone', next_follow_date: f.next_follow_date ? f.next_follow_date.slice(0, 10) : '' })
    setShowFollowForm(true)
  }

  const handleUpdateFollowUp = async () => {
    if (!followForm.content.trim()) { toast('请输入跟进内容', 'error'); return }
    setFollowSubmitting(true)
    const r = await clientApi.updateFollowUp(editingFollowUp.id, followForm)
    setFollowSubmitting(false)
    if (r.success) { toast('跟进记录已更新', 'success'); setShowFollowForm(false); setEditingFollowUp(null); setFollowForm({ content: '', follow_type: 'phone', next_follow_date: '' }); load() }
    else toast(r.message || '更新失败', 'error')
  }

  const handleDeleteFollowUp = async (fId: number) => {
    const r = await clientApi.deleteFollowUp(fId)
    if (r.success) { toast('跟进记录已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const getFollowIcon = (type: string) => {
    switch (type) {
      case 'phone': return <PhoneCall size={14} />
      case 'wechat': return <MessageSquare size={14} />
      case 'visit': return <MapPin size={14} />
      case 'email': return <AtSign size={14} />
      default: return <HelpCircle size={14} />
    }
  }

  const openAddContact = () => {
    setEditingContact(null)
    setContactForm({ name: '', position: '', phone: '', email: '', wechat: '', is_primary: false, notes: '' })
    setContactModalOpen(true)
  }
  const openEditContact = (c: any) => {
    setEditingContact(c)
    setContactForm({ name: c.name || '', position: c.position || '', phone: c.phone || '', email: c.email || '', wechat: c.wechat || '', is_primary: !!c.is_primary, notes: c.notes || '' })
    setContactModalOpen(true)
  }
  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) { toast('请输入联系人姓名', 'error'); return }
    setContactSaving(true)
    const payload = { ...contactForm, is_primary: contactForm.is_primary ? 1 : 0 }
    const r = editingContact
      ? await clientApi.updateContact(editingContact.id, payload)
      : await clientApi.createContact({ ...payload, client_id: Number(id) })
    setContactSaving(false)
    if (r.success) { toast(editingContact ? '联系人已更新' : '联系人已添加', 'success'); setContactModalOpen(false); load() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteContact = async (cid: number) => {
    if (!(await confirm({ message: '确定删除此联系人？', danger: true }))) return
    const r = await clientApi.deleteContact(cid)
    if (r.success) { toast('联系人已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const openTagModal = async () => {
    const r = await clientApi.allTags()
    if (r.success) setAllTags(r.data || [])
    setSelectedTagIds(clientTags.map((t: any) => t.id))
    setTagModalOpen(true)
  }
  const toggleTag = (tid: number) => {
    setSelectedTagIds(prev => prev.includes(tid) ? prev.filter(i => i !== tid) : [...prev, tid])
  }
  const handleSaveTags = async () => {
    const r = await clientApi.setClientTags(id!, selectedTagIds)
    if (r.success) { toast('标签已更新', 'success'); setTagModalOpen(false); load() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const r = await clientApi.createTag({ name: newTagName.trim(), color: newTagColor })
    if (r.success) {
      setNewTagName('')
      const r2 = await clientApi.allTags()
      if (r2.success) setAllTags(r2.data || [])
      setSelectedTagIds(prev => [...prev, r.data.id])
    } else toast(r.message || '创建失败', 'error')
  }

  const contractStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: '草稿', color: '#6b7280', bg: '#f3f4f6' },
    active: { label: '生效中', color: '#16a34a', bg: '#f0fdf4' },
    expired: { label: '已到期', color: '#d97706', bg: '#fef3c7' },
    terminated: { label: '已终止', color: '#dc2626', bg: '#fef2f2' },
  }
  const openAddContract = () => {
    setEditingContract(null)
    setContractForm({ title: '', amount: '', status: 'draft', signed_date: '', expire_date: '', notes: '' })
    setContractModalOpen(true)
  }
  const openEditContract = (c: any) => {
    setEditingContract(c)
    setContractForm({
      title: c.title || '', amount: String(c.amount || ''), status: c.status || 'draft',
      signed_date: c.signed_date ? new Date(c.signed_date).toISOString().slice(0, 10) : '',
      expire_date: c.expire_date ? new Date(c.expire_date).toISOString().slice(0, 10) : '',
      notes: c.notes || '',
    })
    setContractModalOpen(true)
  }
  const handleSaveContract = async () => {
    if (!contractForm.title.trim()) { toast('请输入合同标题', 'error'); return }
    setContractSaving(true)
    const payload = { ...contractForm, amount: Number(contractForm.amount) || 0 }
    const r = editingContract
      ? await clientApi.updateContract(editingContract.id, payload)
      : await clientApi.createContract({ ...payload, client_id: Number(id) })
    setContractSaving(false)
    if (r.success) { toast(editingContract ? '合同已更新' : '合同已创建', 'success'); setContractModalOpen(false); load() }
    else toast(r.message || '保存失败', 'error')
  }
  const handleDeleteContract = async (cid: number) => {
    if (!(await confirm({ message: '确定删除此合同？', danger: true }))) return
    const r = await clientApi.deleteContract(cid)
    if (r.success) { toast('合同已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  if (!client) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav('/clients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, flex: 1 }}>客户详情</h1>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: menuOpen ? '#f1f5f9' : '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#334155' }}>
            <MoreVertical size={16} /> 操作
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', minWidth: 180, zIndex: 100, overflow: 'hidden' }}>
              <div onClick={openEdit} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#334155' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <Settings size={15} color="#64748b" /> 设置客户信息
              </div>
              <div onClick={openHistory} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#334155' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <History size={15} color="#64748b" /> 修改历史记录
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9' }} />
              <div onClick={handleDelete} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#dc2626' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <Trash2 size={15} /> 删除客户
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Avatar name={client.name} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>#{client.id}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{client.name}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: client.client_type === 'individual' ? '#fef3c7' : '#dbeafe', color: client.client_type === 'individual' ? '#92400e' : '#1e40af', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{client.client_type === 'individual' ? <><UserCircle size={12} /> 个人</> : <><Building2 size={12} /> 企业</>}</span>
              {(() => { const s = stageMap[client.stage || 'potential'] || stageMap.potential; return <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span> })()}
            </div>
            {client.company && <div style={{ fontSize: 14, color: '#64748b' }}>{client.company}</div>}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
          {client.channel && <div style={infoRow}><Tag size={16} color="#2563eb" /> <span style={{ color: '#2563eb', fontWeight: 500 }}>{client.channel}</span></div>}
          {client.company && <div style={infoRow}><Building size={16} color="#64748b" /> {client.company}</div>}
          {client.email && <div style={infoRow}><Mail size={16} color="#64748b" /> {client.email}</div>}
          {client.phone && <div style={infoRow}><Phone size={16} color="#64748b" /> {client.phone}</div>}
          {client.position_level && <div style={infoRow}><Users size={16} color="#7c3aed" /> <span style={{ color: '#7c3aed', fontWeight: 500 }}>职位: {client.position_level}</span></div>}
          {client.department && <div style={infoRow}><Building size={16} color="#0284c7" /> <span style={{ color: '#0284c7' }}>部门: {client.department}</span></div>}
          {client.job_function && <div style={infoRow}><Settings size={16} color="#d97706" /> <span style={{ color: '#d97706' }}>职能: {client.job_function}</span></div>}
          {client.assigned_name && <div style={infoRow}><UserPlus size={16} color="#7c3aed" /> <span style={{ color: '#7c3aed', fontWeight: 500 }}>对接人: {client.assigned_name}</span></div>}
          {client.notes && <div style={infoRow}><FileText size={16} color="#64748b" /> {client.notes}</div>}
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 8, paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
            <Clock size={12} /> 创建于 {new Date(client.created_at).toLocaleString('zh-CN')}
          </div>
          {client.updated_at !== client.created_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              <Clock size={12} /> 最后修改 {new Date(client.updated_at).toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      </div>

      {score && (() => {
        const colors: Record<string, string> = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#f97316', E: '#dc2626' }
        const dimLabels: Record<string, string> = { follow: '跟进活跃', contract: '合同价值', stage: '阶段进展', contact: '联系人', info: '信息完整' }
        const dimMax: Record<string, number> = { follow: 30, contract: 25, stage: 20, contact: 10, info: 15 }
        return (
          <div style={{ ...section, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Zap size={18} color={colors[score.label]} />
              <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>智能评分</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: colors[score.label], marginLeft: 'auto' }}>{score.label}</span>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>{score.total}/100</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(score.breakdown).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 70, color: '#64748b', flexShrink: 0 }}>{dimLabels[k] || k}</span>
                  <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${((v as number) / dimMax[k]) * 100}%`, background: colors[score.label], borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ width: 36, textAlign: 'right', color: '#94a3b8', fontSize: 12 }}>{v as number}/{dimMax[k]}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {(clientTags.length > 0 || true) && (
        <div style={{ ...section, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={18} color="#f59e0b" />
              <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>标签</span>
            </div>
            <button onClick={openTagModal} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#64748b' }}>管理标签</button>
          </div>
          {clientTags.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>暂无标签，点击"管理标签"添加</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {clientTags.map((t: any) => (
                <span key={t.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: t.color + '18', color: t.color, fontWeight: 500, border: `1px solid ${t.color}30` }}>{t.name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ ...section, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#7c3aed" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>联系人</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>({contacts.length})</span>
          </div>
          <Button onClick={openAddContact}><UserPlus size={14} /> 添加联系人</Button>
        </div>
        {contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无联系人，点击“添加联系人”开始</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {contacts.map((c: any) => (
              <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, position: 'relative' }}>
                {c.is_primary === 1 && <Star size={14} color="#f59e0b" fill="#f59e0b" style={{ position: 'absolute', top: 10, right: 10 }} />}
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{c.name}</div>
                {c.position && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{c.position}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {c.phone && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} color="#94a3b8" />{c.phone}</div>}
                  {c.email && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} color="#94a3b8" />{c.email}</div>}
                  {c.wechat && <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} color="#94a3b8" />{c.wechat}</div>}
                </div>
                {c.notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{c.notes}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => openEditContact(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                  <button onClick={() => handleDeleteContact(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><X size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...section, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSignature size={18} color="#16a34a" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>合同订单</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>({contracts.length})</span>
          </div>
          <Button onClick={openAddContract}><Plus size={14} /> 新建合同</Button>
        </div>
        {contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>暂无合同，点击"新建合同"开始</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contracts.map((c: any) => {
              const st = contractStatusMap[c.status] || contractStatusMap.draft
              return (
                <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.title}</span>
                      <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
                      <span><DollarSign size={12} style={{ verticalAlign: -1 }} /> ¥{Number(c.amount || 0).toLocaleString()}</span>
                      {c.signed_date && <span>签约: {new Date(c.signed_date).toLocaleDateString('zh-CN')}</span>}
                      {c.expire_date && <span>到期: {new Date(c.expire_date).toLocaleDateString('zh-CN')}</span>}
                    </div>
                    {c.notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{c.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEditContract(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex' }}><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteContract(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, display: 'flex' }}><X size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ ...section, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#7c3aed" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>AI 跟进建议</span>
          </div>
          <Button onClick={async () => {
            setAiLoading(true); setAiSuggestion('')
            const r = await clientApi.aiSuggestion(id!)
            setAiLoading(false)
            if (r.success) setAiSuggestion(r.data)
            else toast(r.message || 'AI 服务不可用', 'error')
          }} disabled={aiLoading}>
            {aiLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 分析中...</> : <><Sparkles size={14} /> 获取建议</>}
          </Button>
        </div>
        {aiSuggestion ? (
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 14, fontSize: 14, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiSuggestion}</div>
        ) : (
          <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 12 }}>点击"获取建议"让 AI 分析客户数据并给出跟进建议</div>
        )}
      </div>

      <div style={{ ...section, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="#2563eb" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>跟进记录</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>({followUps.length})</span>
          </div>
          <Button onClick={() => { setEditingFollowUp(null); setFollowForm({ content: '', follow_type: 'phone', next_follow_date: '' }); setShowFollowForm(!showFollowForm) }}><Plus size={14} /> 新增跟进</Button>
        </div>

        {showFollowForm && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>跟进方式</label>
                <select value={followForm.follow_type} onChange={e => setFollowForm({ ...followForm, follow_type: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}>
                  {Object.entries(followTypeMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>下次跟进日期</label>
                <input type="date" value={followForm.next_follow_date} onChange={e => setFollowForm({ ...followForm, next_follow_date: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }} />
              </div>
            </div>
            <textarea value={followForm.content} onChange={e => setFollowForm({ ...followForm, content: e.target.value })}
              placeholder="输入跟进内容..." rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={() => { setShowFollowForm(false); setEditingFollowUp(null) }}>取消</Button>
              <Button onClick={editingFollowUp ? handleUpdateFollowUp : handleCreateFollow} disabled={followSubmitting}><Send size={14} /> {followSubmitting ? '提交中...' : editingFollowUp ? '保存修改' : '提交'}</Button>
            </div>
          </div>
        )}

        {followUps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>暂无跟进记录，点击“新增跟进”开始</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: '#e2e8f0' }} />
            {followUps.map((f: any) => (
              <div key={f.id} style={{ position: 'relative', paddingBottom: 20 }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 16, height: 16, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {getFollowIcon(f.follow_type)}
                </div>
                <div style={{ marginLeft: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(f.created_at).toLocaleString('zh-CN')}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>{followTypeMap[f.follow_type]?.label || f.follow_type}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{f.created_by_name || '用户'}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{f.content}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {f.next_follow_date && (
                      <span style={{ fontSize: 12, color: '#f59e0b' }}>⏰ 下次跟进: {new Date(f.next_follow_date).toLocaleDateString('zh-CN')}</span>
                    )}
                    <span style={{ marginLeft: 'auto' }} />
                    <button onClick={() => startEditFollowUp(f)} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>编辑</button>
                    <button onClick={() => handleDeleteFollowUp(f.id)} style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="设置客户信息">
        {(() => { const ee = editErrors; const es: React.CSSProperties = { fontSize: 12, color: '#dc2626', marginTop: 4 }; const clr = (k: string) => setEditErrors(prev => { const n = { ...prev }; delete n[k]; return n }); return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>客户类型</label>
            <div style={{ display: 'flex', gap: 0, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              {[{ key: 'company', label: '企业客户', icon: Building2 }, { key: 'individual', label: '个人客户', icon: UserCircle }].map(t => (
                <button key={t.key} type="button" onClick={() => setForm({ ...form, client_type: t.key, company: t.key === 'individual' ? '' : form.company })}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: form.client_type === t.key ? '#fff' : 'transparent', color: form.client_type === t.key ? '#0f172a' : '#64748b',
                    boxShadow: form.client_type === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>渠道 <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.channel} onChange={e => { setForm({ ...form, channel: e.target.value }); clr('channel') }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.channel ? '#dc2626' : '#cbd5e1'}`, fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">请选择渠道</option>
              {channels.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {ee.channel && <div style={es}>{ee.channel}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>客户阶段</label>
            <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              {Object.entries(stageMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Input label="客户名称 *" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); clr('name') }} />
            {ee.name && <div style={es}>{ee.name}</div>}
          </div>
          {form.client_type === 'company' && <div>
            <Input label="公司 *" value={form.company} onChange={e => { setForm({ ...form, company: e.target.value }); clr('company') }} />
            {ee.company && <div style={es}>{ee.company}</div>}
          </div>}
          <div>
            <Input label="邮箱 *" placeholder="name@example.com" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); clr('email') }} />
            {ee.email && <div style={es}>{ee.email}</div>}
          </div>
          <div>
            <Input label="电话 *" placeholder="13800138000" value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); clr('phone') }} />
            {ee.phone && <div style={es}>{ee.phone}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>职位级别 <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.position_level} onChange={e => { setForm({ ...form, position_level: e.target.value }); clr('position_level') }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.position_level ? '#dc2626' : '#cbd5e1'}`, fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">请选择职位级别</option>
              {positionLevels.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {ee.position_level && <div style={es}>{ee.position_level}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>部门 <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.department} onChange={e => { setForm({ ...form, department: e.target.value }); clr('department') }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.department ? '#dc2626' : '#cbd5e1'}`, fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">请选择部门</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {ee.department && <div style={es}>{ee.department}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>工作职能 <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.job_function} onChange={e => { setForm({ ...form, job_function: e.target.value }); clr('job_function') }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${ee.job_function ? '#dc2626' : '#cbd5e1'}`, fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">请选择工作职能</option>
              {jobFunctions.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            {ee.job_function && <div style={es}>{ee.job_function}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>对接人</label>
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">暂不分配</option>
              {staffMembers.map((u: any) => <option key={u.id} value={u.id}>{u.nickname || u.username} ({u.role === 'admin' ? '管理' : u.role === 'business' ? '业务' : '技术'})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
        ) })()}
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="修改历史记录">
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>暂无修改记录</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {logs.map((log: any, i: number) => (
              <div key={log.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                <div style={{ width: 130, flexShrink: 0, color: '#94a3b8', fontSize: 12 }}>{new Date(log.changed_at).toLocaleString('zh-CN')}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#64748b' }}>{log.changed_by_name || '用户'}</span>
                  {' 修改了 '}
                  <span style={{ fontWeight: 600, color: '#334155' }}>{fieldLabel[log.field_name] || log.field_name}</span>
                  {log.old_value && <span style={{ color: '#dc2626', textDecoration: 'line-through', marginLeft: 6 }}>{log.old_value}</span>}
                  <span style={{ color: '#16a34a', marginLeft: 6 }}>{log.new_value || '(空)'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={contactModalOpen} onClose={() => setContactModalOpen(false)} title={editingContact ? '编辑联系人' : '添加联系人'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="姓名 *" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
          <Input label="职位" value={contactForm.position} onChange={e => setContactForm({ ...contactForm, position: e.target.value })} />
          <Input label="电话" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} />
          <Input label="邮箱" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
          <Input label="微信" value={contactForm.wechat} onChange={e => setContactForm({ ...contactForm, wechat: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
            <textarea value={contactForm.notes} onChange={e => setContactForm({ ...contactForm, notes: e.target.value })} rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm({ ...contactForm, is_primary: e.target.checked })} />
            设为主要联系人
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setContactModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveContact} disabled={contactSaving}>{contactSaving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={tagModalOpen} onClose={() => setTagModalOpen(false)} title="管理标签">
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新标签名称..."
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }} />
            <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)}
              style={{ width: 36, height: 32, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
            <button onClick={handleCreateTag}
              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13 }}>创建</button>
          </div>
          {allTags.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 16 }}>暂无标签，请先创建</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allTags.map((t: any) => {
                const selected = selectedTagIds.includes(t.id)
                return (
                  <button key={t.id} onClick={() => toggleTag(t.id)}
                    style={{ padding: '5px 12px', borderRadius: 16, border: selected ? `2px solid ${t.color}` : '2px solid #e2e8f0', background: selected ? t.color + '18' : '#fff', color: selected ? t.color : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: selected ? 600 : 400, transition: 'all 0.15s' }}>
                    {t.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={() => setTagModalOpen(false)}>取消</Button>
          <Button onClick={handleSaveTags}>保存</Button>
        </div>
      </Modal>

      <Modal open={contractModalOpen} onClose={() => setContractModalOpen(false)} title={editingContract ? '编辑合同' : '新建合同'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="合同标题 *" value={contractForm.title} onChange={e => setContractForm({ ...contractForm, title: e.target.value })} />
          <Input label="金额 (¥)" value={contractForm.amount} onChange={e => setContractForm({ ...contractForm, amount: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>状态</label>
            <select value={contractForm.status} onChange={e => setContractForm({ ...contractForm, status: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="draft">草稿</option>
              <option value="active">生效中</option>
              <option value="expired">已到期</option>
              <option value="terminated">已终止</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>签约日期</label>
              <input type="date" value={contractForm.signed_date} onChange={e => setContractForm({ ...contractForm, signed_date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>到期日期</label>
              <input type="date" value={contractForm.expire_date} onChange={e => setContractForm({ ...contractForm, expire_date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
            <textarea value={contractForm.notes} onChange={e => setContractForm({ ...contractForm, notes: e.target.value })} rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setContractModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveContract} disabled={contractSaving}>{contractSaving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
