import { useState, useEffect } from 'react'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { Plug2, Plus, Copy, RotateCcw, Trash2, TestTube2, Eye, EyeOff, Edit2, ExternalLink, ChevronDown } from 'lucide-react'

const PERMISSION_OPTIONS = [
  { value: 'clients:read', label: '读取客户', desc: '查询客户列表和详情' },
  { value: 'clients:write', label: '写入客户', desc: '创建/更新客户数据' },
  { value: 'projects:read', label: '读取项目', desc: '查询项目列表和详情' },
  { value: 'projects:write', label: '写入项目', desc: '创建/更新项目数据' },
  { value: 'webhook', label: 'Webhook', desc: '接收合作方推送事件' },
]

interface Partner {
  id: number; partner_name: string; api_key: string; partner_url: string | null; partner_key?: string
  permissions: string[]; is_active: number; last_used_at: string | null; call_count: number
  created_at: string; notes: string | null
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }
const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }

export default function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [form, setForm] = useState({ partner_name: '', partner_url: '', partner_key: '', permissions: [] as string[], notes: '' })
  const [saving, setSaving] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set())
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; msg: string } | null>(null)

  const load = async () => {
    setLoading(true)
    const r = await fetchApi('/api/partners')
    if (r.success) setPartners(r.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ partner_name: '', partner_url: '', partner_key: '', permissions: [], notes: '' })
    setModalOpen(true)
  }

  const openEdit = (p: Partner) => {
    setEditing(p)
    setForm({
      partner_name: p.partner_name, partner_url: p.partner_url || '', partner_key: '',
      permissions: p.permissions || [], notes: p.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.partner_name.trim()) { toast('请输入合作方名称', 'error'); return }
    setSaving(true)
    const body: any = { ...form, is_active: 1 }
    if (!body.partner_key) delete body.partner_key
    const r = editing
      ? await fetchApi(`/api/partners/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await fetchApi('/api/partners', { method: 'POST', body: JSON.stringify(body) })
    setSaving(false)
    if (r.success) {
      toast(r.message || '保存成功', 'success')
      if (!editing && r.data?.api_key) {
        await navigator.clipboard?.writeText(r.data.api_key).catch(() => {})
        toast('API Key 已复制到剪贴板，请发送给合作方', 'success')
      }
      setModalOpen(false)
      load()
    } else toast(r.message || '保存失败', 'error')
  }

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard?.writeText(key)
    toast('API Key 已复制', 'success')
  }

  const handleResetKey = async (p: Partner) => {
    const ok = await confirm({ message: `确定重置 [${p.partner_name}] 的 API Key？旧 Key 将立即失效。`, danger: true })
    if (!ok) return
    const r = await fetchApi(`/api/partners/${p.id}/reset-key`, { method: 'POST' })
    if (r.success) {
      toast('已重置，新 Key 已复制到剪贴板', 'success')
      await navigator.clipboard?.writeText(r.data.api_key).catch(() => {})
      load()
    }
  }

  const handleToggle = async (p: Partner) => {
    const r = await fetchApi(`/api/partners/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...p, permissions: p.permissions, is_active: p.is_active ? 0 : 1 }),
    })
    if (r.success) { toast(p.is_active ? '已禁用' : '已启用', 'success'); load() }
  }

  const handleDelete = async (p: Partner) => {
    const ok = await confirm({ message: `确定删除合作方 [${p.partner_name}]？删除后对方将无法调用任何接口。`, danger: true })
    if (!ok) return
    const r = await fetchApi(`/api/partners/${p.id}`, { method: 'DELETE' })
    if (r.success) { toast('已删除', 'success'); load() }
  }

  const handleTest = async (p: Partner) => {
    setTestResult({ id: p.id, ok: false, msg: '测试中...' })
    const r = await fetchApi(`/api/partners/${p.id}/test`, { method: 'POST' })
    setTestResult({ id: p.id, ok: r.success, msg: r.message || (r.success ? '连接成功' : '连接失败') })
  }

  const togglePerm = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm],
    }))
  }

  const toggleKeyVisible = (id: number) => {
    setVisibleKeys(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const maskKey = (key: string) => key.substring(0, 6) + '••••••••••••••••'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plug2 size={24} color="#2563eb" /> 合作方管理
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>管理第三方系统的 API Key 和对接配置，实现深度集成</p>
        </div>
        <Button onClick={openCreate}><Plus size={14} /> 添加合作方</Button>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: '合作方总数', value: partners.length, color: '#2563eb' },
          { label: '已启用', value: partners.filter(p => p.is_active).length, color: '#16a34a' },
          { label: '已禁用', value: partners.filter(p => !p.is_active).length, color: '#94a3b8' },
          { label: '总调用次数', value: partners.reduce((s, p) => s + (p.call_count || 0), 0), color: '#8b5cf6' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>
      ) : !partners.length ? (
        <div style={{ ...card, padding: '60px 24px', textAlign: 'center' }}>
          <Plug2 size={48} color="#cbd5e1" />
          <h3 style={{ color: '#64748b', margin: '16px 0 8px' }}>暂无合作方</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>添加合作方后，将自动生成 API Key 供对方调用你的系统</p>
          <Button onClick={openCreate}><Plus size={14} /> 添加第一个合作方</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {partners.map(p => (
            <div key={p.id} style={{ ...card, borderLeft: `4px solid ${p.is_active ? '#2563eb' : '#cbd5e1'}` }}>
              <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: p.is_active ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plug2 size={20} color={p.is_active ? '#2563eb' : '#94a3b8'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.partner_name}
                      <Badge color={p.is_active ? 'green' : 'gray'}>{p.is_active ? '已启用' : '已禁用'}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      创建于 {new Date(p.created_at).toLocaleDateString('zh-CN')} · 调用 {p.call_count} 次
                      {p.last_used_at && ` · 最近: ${new Date(p.last_used_at).toLocaleString('zh-CN')}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(p)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }} title="编辑"><Edit2 size={14} /></button>
                  <button onClick={() => handleToggle(p)} style={{ background: p.is_active ? '#fef2f2' : '#f0fdf4', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: p.is_active ? '#dc2626' : '#16a34a', display: 'flex', fontSize: 12, alignItems: 'center' }}>
                    {p.is_active ? '禁用' : '启用'}
                  </button>
                  <button onClick={() => handleDelete(p)} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#dc2626', display: 'flex' }} title="删除"><Trash2 size={14} /></button>
                </div>
              </div>

              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* API Key */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>分配给对方的 API Key</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 13 }}>
                    <span style={{ flex: 1, color: '#334155', wordBreak: 'break-all' }}>
                      {visibleKeys.has(p.id) ? p.api_key : maskKey(p.api_key)}
                    </span>
                    <button onClick={() => toggleKeyVisible(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 2 }}>
                      {visibleKeys.has(p.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => handleCopyKey(p.api_key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', padding: 2 }} title="复制"><Copy size={14} /></button>
                    <button onClick={() => handleResetKey(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', display: 'flex', padding: 2 }} title="重置"><RotateCcw size={14} /></button>
                  </div>
                </div>

                {/* 权限 */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>已授权接口</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(p.permissions || []).map(perm => {
                      const opt = PERMISSION_OPTIONS.find(o => o.value === perm)
                      return <Badge key={perm} color="blue">{opt?.label || perm}</Badge>
                    })}
                    {(!p.permissions || !p.permissions.length) && <span style={{ fontSize: 13, color: '#94a3b8' }}>无权限</span>}
                  </div>
                </div>

                {/* 合作方接口地址 + 测试 */}
                {p.partner_url && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>对方接口地址</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#334155', fontFamily: 'monospace' }}>{p.partner_url}</span>
                      <a href={p.partner_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', display: 'flex' }}><ExternalLink size={13} /></a>
                      <button onClick={() => handleTest(p)} style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#2563eb', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TestTube2 size={12} /> 测试连接
                      </button>
                    </div>
                    {testResult?.id === p.id && (
                      <div style={{ marginTop: 6, fontSize: 12, color: testResult.ok ? '#16a34a' : '#dc2626', background: testResult.ok ? '#f0fdf4' : '#fef2f2', padding: '6px 10px', borderRadius: 6 }}>
                        {testResult.msg}
                      </div>
                    )}
                  </div>
                )}

                {p.notes && <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>备注: {p.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑合作方' : '添加合作方'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="合作方名称 *" placeholder="如：货联、本地桥" value={form.partner_name} onChange={e => setForm({ ...form, partner_name: e.target.value })} />
          <Input label="对方接口地址" placeholder="如：http://111.170.173.24:1120/api" value={form.partner_url} onChange={e => setForm({ ...form, partner_url: e.target.value })} />
          <Input label="对方给的 API Key" placeholder="对方分配给你的密钥（用于调对方接口）" value={form.partner_key} onChange={e => setForm({ ...form, partner_key: e.target.value })} />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>授权接口权限</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PERMISSION_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: form.permissions.includes(opt.value) ? '#eff6ff' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: `1px solid ${form.permissions.includes(opt.value) ? '#93c5fd' : '#e2e8f0'}` }}>
                  <input type="checkbox" checked={form.permissions.includes(opt.value)} onChange={() => togglePerm(opt.value)} style={{ accentColor: '#2563eb' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>备注</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="内部备注信息"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <Button onClick={handleSave} disabled={saving} style={{ marginTop: 4 }}>
            {saving ? '保存中...' : editing ? '保存修改' : '创建并生成 API Key'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
