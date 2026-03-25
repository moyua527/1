import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Tag, Building, Mail, Phone, FileText, Clock, MoreVertical, Settings, History, Trash2, UserPlus, Users, Zap, Sparkles, Loader2, Building2, UserCircle } from 'lucide-react'
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
  const [allTags, setAllTags] = useState<any[]>([])
  const [clientTags, setClientTags] = useState<any[]>([])
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6b7280')
  const [contracts, setContracts] = useState<any[]>([])
  const [orgMembers, setOrgMembers] = useState<any[]>([])

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

  const openTagModal = async () => {
    const r = await clientApi.allTags()
    if (r.success) setAllTags(r.data || [])
    setSelectedTagIds(clientTags.map((t: any) => t.id))
    setTagModalOpen(true)
  }
  const toggleTag = (tid: number) => { setSelectedTagIds(prev => prev.includes(tid) ? prev.filter(i => i !== tid) : [...prev, tid]) }
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

  if (!client) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  return (
    <div>
      {/* Header */}
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
              <div onClick={() => { setEditOpen(true); setMenuOpen(false) }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#334155' }}
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

      {/* Client Info Card */}
      <div style={sectionStyle}>
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
          {client.channel && <div style={infoRowStyle}><Tag size={16} color="#2563eb" /> <span style={{ color: '#2563eb', fontWeight: 500 }}>{client.channel}</span></div>}
          {client.company && <div style={infoRowStyle}><Building size={16} color="#64748b" /> {client.company}</div>}
          {client.email && <div style={infoRowStyle}><Mail size={16} color="#64748b" /> {client.email}</div>}
          {client.phone && <div style={infoRowStyle}><Phone size={16} color="#64748b" /> {client.phone}</div>}
          {client.position_level && <div style={infoRowStyle}><Users size={16} color="#7c3aed" /> <span style={{ color: '#7c3aed', fontWeight: 500 }}>职位: {client.position_level}</span></div>}
          {client.department && <div style={infoRowStyle}><Building size={16} color="#0284c7" /> <span style={{ color: '#0284c7' }}>部门: {client.department}</span></div>}
          {client.job_function && <div style={infoRowStyle}><Settings size={16} color="#d97706" /> <span style={{ color: '#d97706' }}>职能: {client.job_function}</span></div>}
          {client.assigned_name && <div style={infoRowStyle}><UserPlus size={16} color="#7c3aed" /> <span style={{ color: '#7c3aed', fontWeight: 500 }}>对接人: {client.assigned_name}</span></div>}
          {client.notes && <div style={infoRowStyle}><FileText size={16} color="#64748b" /> {client.notes}</div>}
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 8, paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}><Clock size={12} /> 创建于 {new Date(client.created_at).toLocaleString('zh-CN')}</div>
          {client.updated_at !== client.created_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', marginTop: 4 }}><Clock size={12} /> 最后修改 {new Date(client.updated_at).toLocaleString('zh-CN')}</div>
          )}
        </div>
      </div>

      {/* Score Section */}
      {score && (() => {
        const colors: Record<string, string> = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#f97316', E: '#dc2626' }
        const dimLabels: Record<string, string> = { follow: '跟进活跃', contract: '合同价值', stage: '阶段进展', contact: '联系人', info: '信息完整' }
        const dimMax: Record<string, number> = { follow: 30, contract: 25, stage: 20, contact: 10, info: 15 }
        return (
          <div style={{ ...sectionStyle, marginTop: 16 }}>
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

      {/* Tags Section */}
      <div style={{ ...sectionStyle, marginTop: 16 }}>
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

      {/* Extracted Sections */}
      <ContactSection clientId={id!} contacts={contacts} onRefresh={load} />
      {client.client_type === 'company' && <EnterpriseMemberSection clientId={id!} members={orgMembers} onRefresh={load} />}
      <ContractSection clientId={id!} contracts={contracts} onRefresh={load} />

      {/* AI Suggestion */}
      <div style={{ ...sectionStyle, marginTop: 16 }}>
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

      <FollowUpSection clientId={id!} followUps={followUps} onRefresh={load} />

      {/* Modals */}
      <ClientEditModal open={editOpen} onClose={() => setEditOpen(false)} client={client} clientId={id!} onSaved={load} />

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
    </div>
  )
}
