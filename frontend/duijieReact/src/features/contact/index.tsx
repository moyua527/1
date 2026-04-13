import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { UserCheck, Phone, Mail, MessageCircle, Building2, Plus, Edit3, Trash2, Star, Loader2 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { useContacts, useClients, useInvalidate } from '../../hooks/useApi'
import useDebounce from '../../hooks/useDebounce'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import PageHeader from '../ui/PageHeader'
import FilterBar from '../ui/FilterBar'
import EmptyState from '../ui/EmptyState'

export default function ContactList() {
  const { data: contacts = [], isLoading: loading } = useContacts()
  const { data: clients = [] } = useClients()
  const invalidate = useInvalidate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', position: '', phone: '', email: '', wechat: '', notes: '', client_id: '', is_primary: false })
  const [saving, setSaving] = useState(false)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const filtered = contacts.filter(c => {
    if (!debouncedSearch) return true
    const s = debouncedSearch.toLowerCase()
    return (c.name || '').toLowerCase().includes(s) ||
      (c.phone || '').includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.client_name || '').toLowerCase().includes(s) ||
      (c.position || '').toLowerCase().includes(s)
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', position: '', phone: '', email: '', wechat: '', notes: '', client_id: '', is_primary: false })
    setModalOpen(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ name: c.name || '', position: c.position || '', phone: c.phone || '', email: c.email || '', wechat: c.wechat || '', notes: c.notes || '', client_id: String(c.client_id || ''), is_primary: !!c.is_primary })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('请输入联系人姓名', 'error'); return }
    if (!form.client_id) { toast('请选择所属客户', 'error'); return }
    setSaving(true)
    const body = { ...form, client_id: Number(form.client_id), is_primary: form.is_primary ? 1 : 0 }
    const r = editing
      ? await fetchApi(`/api/contacts/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await fetchApi('/api/contacts', { method: 'POST', body: JSON.stringify(body) })
    setSaving(false)
    if (r.success) {
      toast(editing ? '联系人已更新' : '联系人已创建', 'success')
      setModalOpen(false)
      invalidate('contacts')
    } else {
      toast(r.message || '操作失败', 'error')
    }
  }

  const handleDelete = async (c: any) => {
    if (!(await confirm({ message: `确定删除联系人"${c.name}"？`, danger: true }))) return
    const r = await fetchApi(`/api/contacts/${c.id}`, { method: 'DELETE' })
    if (r.success) { toast('联系人已删除', 'success'); invalidate('contacts') }
    else toast(r.message || '删除失败', 'error')
  }

  return (
    <div>
      <PageHeader title="联系人管理" subtitle={`共 ${contacts.length} 位联系人`}
        actions={<Button onClick={openCreate}><Plus size={16} /> 新建联系人</Button>} />

      <FilterBar
        search={search} onSearchChange={setSearch} searchPlaceholder="搜索姓名、电话、邮箱、公司..."
        filters={[]} resultCount={filtered.length}
        hasFilters={!!search.trim()} activeFilterCount={search.trim() ? 1 : 0}
        onClearFilters={() => setSearch('')}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserCheck} title={debouncedSearch ? '无匹配联系人' : '暂无联系人'} subtitle={debouncedSearch ? undefined : '点击右上角新建联系人'} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtered.map(c => (
            <div key={c.id} style={{
              background: 'var(--bg-primary)', borderRadius: 12, padding: 16,
              border: '1px solid var(--border-primary)', transition: 'box-shadow 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-light-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'var(--brand)',
                  }}>
                    {(c.name || '?')[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.name}
                      {c.is_primary === 1 && <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />}
                    </div>
                    {c.position && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.position}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>

              {c.client_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <Building2 size={12} /> {c.client_name}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-body)' }}>
                    <Phone size={12} style={{ color: 'var(--text-tertiary)' }} /> {c.phone}
                  </div>
                )}
                {c.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-body)' }}>
                    <Mail size={12} style={{ color: 'var(--text-tertiary)' }} /> {c.email}
                  </div>
                )}
                {c.wechat && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-body)' }}>
                    <MessageCircle size={12} style={{ color: 'var(--text-tertiary)' }} /> {c.wechat}
                  </div>
                )}
              </div>

              {c.notes && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑联系人' : '新建联系人'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="姓名 *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>所属客户 *</label>
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', fontSize: 13, color: 'var(--text-body)' }}>
              <option value="">请选择客户</option>
              {clients.map((cl: any) => <option key={cl.id} value={cl.id}>{cl.company_name}</option>)}
            </select>
          </div>
          <Input label="职位" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
          <Input label="电话" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="邮箱" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="微信" value={form.wechat} onChange={e => setForm({ ...form, wechat: e.target.value })} />
          <Input label="备注" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-body)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_primary} onChange={e => setForm({ ...form, is_primary: e.target.checked })} />
            设为主要联系人
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>取消</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
