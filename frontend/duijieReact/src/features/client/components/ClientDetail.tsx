import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Tag, Building, Mail, Phone, FileText, Clock, MoreVertical, Settings, History, Trash2, UserPlus, Users, Sparkles, Loader2, Building2, UserCircle, ChevronRight, Contact, FileSignature, MessageSquare } from 'lucide-react'
import { clientApi } from '../services/api'
import Avatar from '../../ui/Avatar'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'
import { sectionStyle, infoRowStyle, stageMap, fieldLabel } from './constants'
import ContactSection from './ContactSection'
import ContractSection from './ContractSection'
import FollowUpSection from './FollowUpSection'
import EnterpriseMemberSection from './EnterpriseMemberSection'
import ClientEditModal from './ClientEditModal'
import ScoreSection from './ScoreSection'
import TagManageModal from './TagManageModal'

export default function ClientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const [followUps, setFollowUps] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [score, setScore] = useState<any>(null)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [clientTags, setClientTags] = useState<any[]>([])
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [orgMembers, setOrgMembers] = useState<any[]>([])
  const [openSection, setOpenSection] = useState<string | null>(null)

  const load = () => {
    if (!id) return
    clientApi.detail(id).then(r => { if (r.success) setClient(r.data) })
    clientApi.followUps(id).then(r => { if (r.success) setFollowUps(r.data || []) })
    clientApi.contacts(id).then(r => { if (r.success) setContacts(r.data || []) })
    clientApi.clientTags(id).then(r => { if (r.success) setClientTags(r.data || []) })
    clientApi.contracts(id).then(r => { if (r.success) setContracts(r.data || []) })
    clientApi.score(id).then(r => { if (r.success) setScore(r.data) })
    clientApi.members(id).then(r => { if (r.success) setOrgMembers(r.data || []) })
  }
  useEffect(load, [id])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openHistory = async () => {
    setMenuOpen(false)
    const r = await clientApi.logs(id!)
    if (r.success) setLogs(r.data || [])
    setHistoryOpen(true)
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    if (!(await confirm({ message: '确定删除此客户？删除后不可恢复。', danger: true }))) return
    const r = await clientApi.remove(id!)
    if (r.success) { toast('客户已删除', 'success'); nav('/clients') }
    else toast(r.message || '删除失败', 'error')
  }

  if (!client) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav('/clients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0, flex: 1 }}>客户详情</h1>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: menuOpen ? 'var(--bg-tertiary)' : 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-body)' }}>
            <MoreVertical size={16} /> 操作
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid var(--border-primary)', minWidth: 180, zIndex: 100, overflow: 'hidden' }}>
              <div onClick={() => { setEditOpen(true); setMenuOpen(false) }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-primary)')}>
                <Settings size={15} color="var(--text-secondary)" /> 设置客户信息
              </div>
              <div onClick={openHistory} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-primary)')}>
                <History size={15} color="var(--text-secondary)" /> 修改历史记录
              </div>
              <div style={{ borderTop: '1px solid var(--border-secondary)' }} />
              <div onClick={handleDelete} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--color-danger)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-primary)')}>
                <Trash2 size={15} /> 删除客户
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Info Card */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Avatar name={client.name} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>#{client.id}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>{client.name}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: client.client_type === 'individual' ? '#fef3c7' : 'var(--brand-light-2)', color: client.client_type === 'individual' ? '#92400e' : 'var(--brand)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{client.client_type === 'individual' ? <><UserCircle size={12} /> 个人</> : <><Building2 size={12} /> 企业</>}</span>
              {(() => { const s = stageMap[client.stage || 'potential'] || stageMap.potential; return <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span> })()}
            </div>
            {client.company && <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{client.company}</div>}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 12 }}>
          {client.channel && <div style={infoRowStyle}><Tag size={16} color="var(--brand)" /> <span style={{ color: 'var(--brand)', fontWeight: 500 }}>{client.channel}</span></div>}
          {client.company && <div style={infoRowStyle}><Building size={16} color="var(--text-secondary)" /> {client.company}</div>}
          {client.email && <div style={infoRowStyle}><Mail size={16} color="var(--text-secondary)" /> {client.email}</div>}
          {client.phone && <div style={infoRowStyle}><Phone size={16} color="var(--text-secondary)" /> {client.phone}</div>}
          {client.position_level && <div style={infoRowStyle}><Users size={16} color="var(--color-purple)" /> <span style={{ color: 'var(--color-purple)', fontWeight: 500 }}>职位: {client.position_level}</span></div>}
          {client.department && <div style={infoRowStyle}><Building size={16} color="var(--brand)" /> <span style={{ color: '#0284c7' }}>部门: {client.department}</span></div>}
          {client.job_function && <div style={infoRowStyle}><Settings size={16} color="var(--color-warning)" /> <span style={{ color: 'var(--color-warning)' }}>职能: {client.job_function}</span></div>}
          {client.assigned_name && <div style={infoRowStyle}><UserPlus size={16} color="var(--color-purple)" /> <span style={{ color: 'var(--color-purple)', fontWeight: 500 }}>对接人: {client.assigned_name}</span></div>}
          {client.notes && <div style={infoRowStyle}><FileText size={16} color="var(--text-secondary)" /> {client.notes}</div>}
        </div>
        <div style={{ borderTop: '1px solid var(--border-primary)', marginTop: 8, paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}><Clock size={12} /> 创建于 {new Date(client.created_at).toLocaleString('zh-CN')}</div>
          {client.updated_at !== client.created_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}><Clock size={12} /> 最后修改 {new Date(client.updated_at).toLocaleString('zh-CN')}</div>
          )}
        </div>
      </div>

      {/* Score Section */}
      <ScoreSection score={score} />

      {/* Tags Section */}
      <div style={{ ...sectionStyle, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} color="#f59e0b" />
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-body)' }}>标签</span>
          </div>
          <button onClick={() => setTagModalOpen(true)} style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>管理标签</button>
        </div>
        {clientTags.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>暂无标签，点击"管理标签"添加</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {clientTags.map((t: any) => (
              <span key={t.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: t.color + '18', color: t.color, fontWeight: 500, border: `1px solid ${t.color}30` }}>{t.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Module Cards Grid */}
      {(() => {
        const cards = [
          { key: 'contacts', icon: <Contact size={22} color="var(--brand)" />, label: '联系人', count: contacts.length, bg: 'var(--bg-selected)', border: 'var(--brand-light-2)' },
          ...(client.client_type === 'company' ? [{ key: 'members', icon: <Users size={22} color="var(--color-success)" />, label: '企业成员', count: orgMembers.length, bg: '#f0fdf4', border: '#dcfce7' }] : []),
          { key: 'contracts', icon: <FileSignature size={22} color="var(--color-warning)" />, label: '合同订单', count: contracts.length, bg: '#fffbeb', border: '#fef3c7' },
          { key: 'ai', icon: <Sparkles size={22} color="var(--color-purple)" />, label: 'AI 跟进建议', bg: '#faf5ff', border: '#e9d5ff' },
          { key: 'followups', icon: <MessageSquare size={22} color="#0891b2" />, label: '跟进记录', count: followUps.length, bg: '#ecfeff', border: '#cffafe' },
        ]
        return (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
            {cards.map(c => (
              <div key={c.key} onClick={() => setOpenSection(c.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: c.bg, borderRadius: 12, border: `1px solid ${c.border}`, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                {c.icon}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{c.label}</div>
                  {'count' in c && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.count} 条</div>}
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            ))}
          </div>

          <Modal open={openSection === 'contacts'} onClose={() => setOpenSection(null)} title="联系人">
            <ContactSection clientId={id!} contacts={contacts} onRefresh={load} embedded />
          </Modal>
          <Modal open={openSection === 'members'} onClose={() => setOpenSection(null)} title="企业成员">
            <EnterpriseMemberSection clientId={id!} members={orgMembers} onRefresh={load} embedded />
          </Modal>
          <Modal open={openSection === 'contracts'} onClose={() => setOpenSection(null)} title="合同订单">
            <ContractSection clientId={id!} contracts={contracts} onRefresh={load} embedded />
          </Modal>
          <Modal open={openSection === 'ai'} onClose={() => setOpenSection(null)} title="AI 跟进建议">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button onClick={async () => {
                setAiLoading(true); setAiSuggestion('')
                const r = await clientApi.aiSuggestion(id!)
                setAiLoading(false)
                if (r.success) setAiSuggestion(r.data)
                else toast(r.message || 'AI 服务不可用', 'error')
              }} disabled={aiLoading}>
                {aiLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 分析中...</> : <><Sparkles size={14} /> 获取建议</>}
              </Button>
              {aiSuggestion ? (
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 14, fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiSuggestion}</div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 12 }}>点击"获取建议"让 AI 分析客户数据并给出跟进建议</div>
              )}
            </div>
          </Modal>
          <Modal open={openSection === 'followups'} onClose={() => setOpenSection(null)} title="跟进记录">
            <FollowUpSection clientId={id!} followUps={followUps} onRefresh={load} embedded />
          </Modal>
        </>)
      })()}

      {/* Modals */}
      <ClientEditModal open={editOpen} onClose={() => setEditOpen(false)} client={client} clientId={id!} onSaved={load} />

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="修改历史记录">
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无修改记录</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {logs.map((log: any, i: number) => (
              <div key={log.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid var(--border-secondary)' : 'none', fontSize: 13 }}>
                <div style={{ width: 130, flexShrink: 0, color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(log.changed_at).toLocaleString('zh-CN')}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{log.changed_by_name || '用户'}</span>
                  {' 修改了 '}
                  <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>{fieldLabel[log.field_name] || log.field_name}</span>
                  {log.old_value && <span style={{ color: 'var(--color-danger)', textDecoration: 'line-through', marginLeft: 6 }}>{log.old_value}</span>}
                  <span style={{ color: 'var(--color-success)', marginLeft: 6 }}>{log.new_value || '(空)'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <TagManageModal open={tagModalOpen} onClose={() => setTagModalOpen(false)} clientId={id!} clientTags={clientTags} onSaved={load} />
    </div>
  )
}
