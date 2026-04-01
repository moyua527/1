import { useState, useEffect, useRef } from 'react'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { Plug2, Plus, Copy, RotateCcw, Trash2, Eye, EyeOff, Edit2, ExternalLink, ArrowLeft, Maximize2, Minimize2, RefreshCw, Monitor } from 'lucide-react'

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

const card: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }
const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-secondary)' }

function AppViewer({ partner, onBack }: { partner: Partner; onBack: () => void }) {
  const [fullscreen, setFullscreen] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const appUrl = partner.partner_url?.replace(/\/+$/, '') || ''

  const handleReload = () => {
    setLoading(true)
    setLoadError(false)
    if (iframeRef.current) {
      iframeRef.current.src = appUrl
    }
  }

  const wrapperStyle: React.CSSProperties = fullscreen
    ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }
    : { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }

  return (
    <div style={wrapperStyle}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }} title="返回">
          <ArrowLeft size={16} />
        </button>

        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-selected)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Monitor size={15} color="var(--brand)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{partner.partner_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{appUrl}</div>
        </div>

        <button onClick={handleReload} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }} title="刷新">
          <RefreshCw size={15} />
        </button>
        <a href={appUrl} target="_blank" rel="noreferrer" style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)', textDecoration: 'none' }} title="新窗口打开">
          <ExternalLink size={15} />
        </a>
        <button onClick={() => setFullscreen(!fullscreen)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }} title={fullscreen ? '退出全屏' : '全屏'}>
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* iframe 区域 */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-tertiary)' }}>
        {loading && !loadError && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>正在加载 {partner.partner_name}...</div>
            </div>
          </div>
        )}

        {loadError && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, background: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Monitor size={32} color="var(--color-danger)" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-heading)' }}>无法在页面内嵌入</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                对方的系统禁止了页面内嵌。你可以在新窗口中打开使用，或联系对方开发者解除限制。
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href={appUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: 'var(--brand)', color: 'var(--bg-primary)', borderRadius: 10, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
                  <ExternalLink size={15} /> 新窗口打开 {partner.partner_name}
                </a>
                <button onClick={handleReload}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--bg-tertiary)', color: 'var(--text-body)', borderRadius: 10, fontSize: 14, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  <RefreshCw size={14} /> 重试
                </button>
              </div>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={appUrl}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setLoadError(true) }}
          style={{ width: '100%', height: '100%', border: 'none', display: loadError ? 'none' : 'block' }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [form, setForm] = useState({ partner_name: '', partner_url: '', partner_key: '', permissions: [] as string[], notes: '' })
  const [saving, setSaving] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set())
  const [viewing, setViewing] = useState<Partner | null>(null)

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
        toast('API Key 已复制到剪贴板', 'success')
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
    const ok = await confirm({ message: `确定重置 [${p.partner_name}] 的 API Key？`, danger: true })
    if (!ok) return
    const r = await fetchApi(`/api/partners/${p.id}/reset-key`, { method: 'POST' })
    if (r.success) {
      toast('已重置', 'success')
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
    const ok = await confirm({ message: `确定删除合作方 [${p.partner_name}]？`, danger: true })
    if (!ok) return
    const r = await fetchApi(`/api/partners/${p.id}`, { method: 'DELETE' })
    if (r.success) { toast('已删除', 'success'); load() }
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

  if (viewing) {
    return <AppViewer partner={viewing} onBack={() => setViewing(null)} />
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plug2 size={24} color="var(--brand)" /> 合作方管理
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>管理合作方系统，直接在 DuiJie 中打开使用对方的程序</p>
        </div>
        <Button onClick={openCreate}><Plus size={14} /> 添加合作方</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>加载中...</div>
      ) : !partners.length ? (
        <div style={{ ...card, padding: '60px 24px', textAlign: 'center' }}>
          <Plug2 size={48} color="#cbd5e1" />
          <h3 style={{ color: 'var(--text-secondary)', margin: '16px 0 8px' }}>暂无合作方</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 20 }}>添加合作方后，可以直接在这里打开对方的程序</p>
          <Button onClick={openCreate}><Plus size={14} /> 添加第一个合作方</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {partners.map(p => (
            <div key={p.id} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: p.is_active ? 'var(--bg-selected)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Monitor size={24} color={p.is_active ? 'var(--brand)' : 'var(--text-tertiary)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>{p.partner_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {p.partner_url ? <span style={{ fontFamily: 'monospace' }}>{p.partner_url}</span> : '未配置地址'}
                    </div>
                  </div>
                  <Badge color={p.is_active ? 'green' : 'gray'}>{p.is_active ? '在线' : '离线'}</Badge>
                </div>

                {p.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>{p.notes}</div>}

                {/* API Key 小行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span>Key: {visibleKeys.has(p.id) ? p.api_key : maskKey(p.api_key)}</span>
                  <button onClick={() => toggleKeyVisible(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                    {visibleKeys.has(p.id) ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button onClick={() => handleCopyKey(p.api_key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', display: 'flex', padding: 0 }}><Copy size={11} /></button>
                  <button onClick={() => handleResetKey(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', display: 'flex', padding: 0 }}><RotateCcw size={11} /></button>
                </div>
              </div>

              {/* 底部按钮 */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-secondary)', display: 'flex', gap: 8 }}>
                {p.partner_url ? (
                  <button onClick={() => setViewing(p)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: 'var(--brand)', color: 'var(--bg-primary)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    <Monitor size={16} /> 打开程序
                  </button>
                ) : (
                  <button onClick={() => openEdit(p)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>
                    配置地址后可打开
                  </button>
                )}
                <button onClick={() => openEdit(p)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }} title="编辑"><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(p)} style={{ background: '#fef2f2', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }} title="删除"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑合作方' : '添加合作方'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="合作方名称 *" placeholder="如：货联、本地桥" value={form.partner_name} onChange={e => setForm({ ...form, partner_name: e.target.value })} />
          <Input label="程序地址 *" placeholder="如：http://111.170.173.24:1120" value={form.partner_url} onChange={e => setForm({ ...form, partner_url: e.target.value })} />
          <p style={{ margin: '-8px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>填写对方网页程序的访问地址，添加后可在 DuiJie 中直接打开使用</p>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>备注</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="备注信息，如：货运管理系统、物流调度平台"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <Button onClick={handleSave} disabled={saving} style={{ marginTop: 4 }}>
            {saving ? '保存中...' : editing ? '保存修改' : '添加合作方'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
