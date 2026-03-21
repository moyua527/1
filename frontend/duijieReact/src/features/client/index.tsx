import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { Plus, Users, Loader2, Search, Download, Zap, Upload } from 'lucide-react'
import { clientApi } from './services/api'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', alignItems: 'center', gap: 16,
}

const stageMap: Record<string, { label: string; color: string; bg: string }> = {
  potential: { label: '潜在', color: '#6b7280', bg: '#f3f4f6' },
  intent: { label: '意向', color: '#2563eb', bg: '#eff6ff' },
  signed: { label: '签约', color: '#7c3aed', bg: '#f5f3ff' },
  active: { label: '合作中', color: '#16a34a', bg: '#f0fdf4' },
  lost: { label: '流失', color: '#dc2626', bg: '#fef2f2' },
}
const stageKeys = ['all', 'potential', 'intent', 'signed', 'active', 'lost']
const stageTabLabel: Record<string, string> = { all: '全部', potential: '潜在', intent: '意向', signed: '签约', active: '合作中', lost: '流失' }

export default function ClientList() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ user_id: '', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', position_level: '', department: '', job_function: '', assigned_to: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const stageFilter = searchParams.get('stage') || 'all'
  const setStageFilter = (s: string) => { if (s === 'all') { searchParams.delete('stage'); setSearchParams(searchParams, { replace: true }) } else { setSearchParams({ stage: s }, { replace: true }) } }
  const [search, setSearch] = useState('')
  const [scores, setScores] = useState<Record<string, any>>({})
  const [memberSearch, setMemberSearch] = useState('')
  const [memberDropOpen, setMemberDropOpen] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const nav = useNavigate()
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const load = () => {
    setLoading(true)
    clientApi.list().then(r => { if (r.success) setClients(r.data || []) }).finally(() => setLoading(false))
    clientApi.allScores().then(r => { if (r.success) setScores(r.data || {}) })
  }
  useEffect(load, [])

  const loadMembers = () => { clientApi.availableMembers().then(r => { if (r.success) setAvailableMembers(r.data || []) }) }

  useEffect(() => {
    if (!memberDropOpen) return
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-member-search]')) setMemberDropOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [memberDropOpen])

  const handleSelectMember = (userId: string) => {
    const m = availableMembers.find((u: any) => String(u.id) === userId)
    if (m) {
      setForm(prev => ({ ...prev, user_id: userId, name: m.nickname || m.username, email: m.email || '', phone: m.phone || '' }))
    } else {
      setForm(prev => ({ ...prev, user_id: '', name: '', email: '', phone: '' }))
    }
  }

  const handleCreate = async () => {
    const e: Record<string, string> = {}
    if (!form.user_id) e.user_id = '请选择成员用户'
    if (!form.channel) e.channel = '请选择渠道'
    if (!form.name.trim()) e.name = '请输入客户名称'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSubmitting(true)
    const r = await clientApi.create({ ...form, user_id: Number(form.user_id) })
    setSubmitting(false)
    if (r.success) { toast('客户添加成功', 'success'); setShowCreate(false); setForm({ user_id: '', name: '', company: '', email: '', phone: '', channel: '', stage: 'potential', position_level: '', department: '', job_function: '', assigned_to: '' }); setErrors({}); load() }
    else toast(r.message || '添加失败', 'error')
  }

  const errStyle: React.CSSProperties = { fontSize: 12, color: '#dc2626', marginTop: 4 }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>客户管理</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>管理所有客户信息</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => {
            const headers = ['客户名称', '公司', '渠道', '阶段', '邮箱', '电话', '职位级别', '部门', '工作职能', '标签', '创建时间']
            const stageLabel: Record<string, string> = { potential: '潜在', intent: '意向', signed: '签约', active: '合作中', lost: '流失' }
            const rows = clients.map(c => [
              c.name, c.company || '', c.channel || '', stageLabel[c.stage || 'potential'] || c.stage || '',
              c.email || '', c.phone || '', c.position_level || '', c.department || '', c.job_function || '',
              (c.tags || []).map((t: any) => t.name).join('/'),
              new Date(c.created_at).toLocaleDateString('zh-CN'),
            ])
            const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `客户数据_${new Date().toISOString().slice(0,10)}.csv`; a.click()
          }}><Download size={16} /> 导出</Button>
          <Button variant="secondary" onClick={() => { setShowImport(true); setImportData([]) }}><Upload size={16} /> 导入</Button>
          <Button onClick={() => { setShowCreate(true); loadMembers() }}><Plus size={16} /> 新增客户</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索客户名称、公司、电话..."
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', borderRadius: 8, padding: 3, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {stageKeys.map(k => {
          const count = k === 'all' ? clients.length : clients.filter(c => (c.stage || 'potential') === k).length
          return (
            <button key={k} onClick={() => setStageFilter(k)}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: stageFilter === k ? '#fff' : 'transparent', color: stageFilter === k ? '#0f172a' : '#64748b',
                boxShadow: stageFilter === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {stageTabLabel[k]} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <Users size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div>暂无客户，点击右上角新增</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '280px' : '340px'}, 1fr))`, gap: isMobile ? 10 : 16 }}>
          {clients.filter(c => {
            if (stageFilter !== 'all' && (c.stage || 'potential') !== stageFilter) return false
            if (search.trim()) {
              const q = search.trim().toLowerCase()
              return [c.name, c.company, c.phone, c.email, c.channel].some(v => v && String(v).toLowerCase().includes(q))
            }
            return true
          }).map((c: any) => {
            const s = stageMap[c.stage || 'potential'] || stageMap.potential
            return (
              <div key={c.id} style={cardStyle} onClick={() => nav(`/clients/${c.id}`)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                <Avatar name={c.name} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>#{c.id}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>
                  </div>
                  {c.company && <div style={{ fontSize: 13, color: '#64748b' }}>{c.company}</div>}
                  {c.channel && <div style={{ fontSize: 12, color: '#2563eb' }}>渠道: {c.channel}</div>}
                  {c.assigned_name && <div style={{ fontSize: 12, color: '#7c3aed' }}>对接人: {c.assigned_name}</div>}
                  {c.tags && c.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {c.tags.slice(0, 4).map((t: any, i: number) => (
                        <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: (t.color || '#6b7280') + '18', color: t.color || '#6b7280', fontWeight: 500 }}>{t.name}</span>
                      ))}
                      {c.tags.length > 4 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{c.tags.length - 4}</span>}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: 50 }}>
                  {scores[c.id] && (() => {
                    const sc = scores[c.id]
                    const colors: Record<string, string> = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#f97316', E: '#dc2626' }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: colors[sc.label] || '#6b7280' }}>{sc.label}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{sc.total}分</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新增客户">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>选择成员用户 <span style={{ color: '#dc2626' }}>*</span></label>
            <div data-member-search style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setMemberDropOpen(true) }}
                onFocus={() => setMemberDropOpen(true)}
                placeholder={form.user_id ? `已选: ${(availableMembers.find(u => String(u.id) === form.user_id)?.nickname || '')}` : '输入ID、用户名或昵称搜索...'}
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${errors.user_id ? '#dc2626' : '#cbd5e1'}`, fontSize: 14, outline: 'none', background: '#fff' }}
              />
              {form.user_id && !memberSearch && (
                <div style={{ position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#0f172a', pointerEvents: 'none' }}>
                  {(() => { const m = availableMembers.find(u => String(u.id) === form.user_id); return m ? `${m.nickname || m.username}${m.display_id ? ` (${m.display_id})` : ''}` : '' })()}
                </div>
              )}
              {memberDropOpen && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', zIndex: 60, maxHeight: 220, overflowY: 'auto' }}>
                  {availableMembers.filter(u => {
                    if (!memberSearch.trim()) return true
                    const q = memberSearch.trim().toLowerCase()
                    return [u.display_id, u.username, u.nickname, u.email, u.phone, u.personal_invite_code].some(v => v && String(v).toLowerCase().includes(q))
                  }).length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>无匹配用户</div>
                  ) : (
                    availableMembers.filter(u => {
                      if (!memberSearch.trim()) return true
                      const q = memberSearch.trim().toLowerCase()
                      return [u.display_id, u.username, u.nickname, u.email, u.phone, u.personal_invite_code].some(v => v && String(v).toLowerCase().includes(q))
                    }).map(u => (
                      <button key={u.id} type="button" onClick={() => { handleSelectMember(String(u.id)); setMemberSearch(''); setMemberDropOpen(false); setErrors(prev => { const n = { ...prev }; delete n.user_id; return n }) }}
                        style={{ width: '100%', padding: '10px 14px', border: 'none', background: String(u.id) === form.user_id ? '#eff6ff' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}
                        onMouseEnter={e => { if (String(u.id) !== form.user_id) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if (String(u.id) !== form.user_id) e.currentTarget.style.background = 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{u.nickname || u.username}</span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>@{u.username}</span>
                        </div>
                        {u.display_id && <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>ID: {u.display_id}</div>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.user_id && <div style={errStyle}>{errors.user_id}</div>}
            {availableMembers.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>暂无可关联的成员用户，请先注册成员账号</div>}
          </div>
          <div>
            <Input label="客户名称 *" placeholder="自动填充" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.name; return n }) }} />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="邮箱" placeholder="自动填充" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input label="电话" placeholder="自动填充" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="公司" placeholder="公司名称（选填）" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>渠道 <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.channel} onChange={e => { setForm({ ...form, channel: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.channel; return n }) }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.channel ? '#dc2626' : '#cbd5e1'}`, fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">请选择渠道</option>
              <option value="Boss直聘">Boss直聘</option>
              <option value="微信">微信</option>
              <option value="抖音">抖音</option>
              <option value="小红书">小红书</option>
              <option value="淘宝">淘宝</option>
              <option value="拼多多">拼多多</option>
              <option value="线下推荐">线下推荐</option>
              <option value="其他">其他</option>
            </select>
            {errors.channel && <div style={errStyle}>{errors.channel}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>客户阶段</label>
            <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              {Object.entries(stageMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>对接人（选填）</label>
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="">暂不分配</option>
              {availableMembers.filter(u => ['admin', 'business', 'tech'].includes(u.role)).map((u: any) => <option key={u.id} value={u.id}>{u.nickname || u.username} ({u.role === 'admin' ? '管理' : u.role === 'business' ? '业务' : '技术'})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? '添加中...' : '添加'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="批量导入客户">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: 20, textAlign: 'center' }}>
            <Upload size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>选择 CSV 文件上传</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>表头: 客户名称, 公司, 渠道, 阶段, 邮箱, 电话, 职位级别, 部门, 工作职能, 备注</div>
            <input type="file" accept=".csv" onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => {
                const text = ev.target?.result as string
                const lines = text.split(/\r?\n/).filter(l => l.trim())
                if (lines.length < 2) { toast('CSV文件至少需要表头和一行数据', 'error'); return }
                const headerMap: Record<string, string> = { '客户名称': 'name', '公司': 'company', '渠道': 'channel', '阶段': 'stage', '邮箱': 'email', '电话': 'phone', '职位级别': 'position_level', '部门': 'department', '工作职能': 'job_function', '备注': 'notes' }
                const stageRev: Record<string, string> = { '潜在': 'potential', '意向': 'intent', '签约': 'signed', '合作中': 'active', '流失': 'lost' }
                const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
                const keys = headers.map(h => headerMap[h] || h)
                const rows = lines.slice(1).map(line => {
                  const vals = line.match(/(".*?"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || []
                  const obj: any = {}
                  keys.forEach((k, i) => { obj[k] = vals[i] || '' })
                  if (obj.stage && stageRev[obj.stage]) obj.stage = stageRev[obj.stage]
                  return obj
                }).filter(r => r.name)
                setImportData(rows)
                toast(`解析成功，共 ${rows.length} 条数据`, 'success')
              }
              reader.readAsText(file, 'UTF-8')
              e.target.value = ''
            }} style={{ fontSize: 13 }} />
          </div>

          {importData.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>预览 (前10条)</div>
              <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                      {['名称', '公司', '渠道', '邮箱', '电话'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 500 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 10).map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '5px 8px' }}>{r.name}</td>
                        <td style={{ padding: '5px 8px' }}>{r.company}</td>
                        <td style={{ padding: '5px 8px' }}>{r.channel}</td>
                        <td style={{ padding: '5px 8px' }}>{r.email}</td>
                        <td style={{ padding: '5px 8px' }}>{r.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importData.length > 10 && <div style={{ fontSize: 12, color: '#94a3b8' }}>...还有 {importData.length - 10} 条未显示</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="secondary" onClick={() => setShowImport(false)}>取消</Button>
                <Button disabled={importing} onClick={async () => {
                  setImporting(true)
                  const r = await clientApi.importClients(importData)
                  setImporting(false)
                  if (r.success) {
                    const d = r.data
                    toast(`导入完成: 成功 ${d.success} 条${d.failed ? `, 失败 ${d.failed} 条` : ''}`, d.failed ? 'error' : 'success')
                    if (d.success > 0) { setShowImport(false); load() }
                  } else toast(r.message || '导入失败', 'error')
                }}>{importing ? '导入中...' : `确认导入 ${importData.length} 条`}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
