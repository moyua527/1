import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'
import { PERMISSION_OPTIONS } from './constants'
import type { Partner } from './constants'
import useThemeStore from '../../stores/useThemeStore'

interface Props {
  open: boolean
  onClose: () => void
  editing: Partner | null
  onSaved: () => void
}

export default function PartnerFormModal({ open, onClose, editing, onSaved }: Props) {
  const colors = useThemeStore(s => s.colors)
  const [form, setForm] = useState(() => ({
    partner_name: editing?.partner_name || '',
    partner_url: editing?.partner_url || '',
    partner_key: '',
    permissions: editing?.permissions || [] as string[],
    notes: editing?.notes || '',
  }))
  const [saving, setSaving] = useState(false)

  const resetForm = (p: Partner | null) => {
    setForm({
      partner_name: p?.partner_name || '',
      partner_url: p?.partner_url || '',
      partner_key: '',
      permissions: p?.permissions || [],
      notes: p?.notes || '',
    })
  }

  // Reset form when editing changes
  useState(() => { resetForm(editing) })

  const togglePerm = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm],
    }))
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
      onClose()
      onSaved()
    } else toast(r.message || '保存失败', 'error')
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? '编辑合作方' : '添加合作方'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="合作方名称 *" placeholder="如：货联、本地桥" value={form.partner_name} onChange={e => setForm({ ...form, partner_name: e.target.value })} />
        <Input label="程序地址 *" placeholder="如：http://111.170.173.24:1120" value={form.partner_url} onChange={e => setForm({ ...form, partner_url: e.target.value })} />
        <p style={{ margin: '-8px 0 0', fontSize: 12, color: colors.textTertiary }}>填写对方网页程序的访问地址，添加后可在 DuiJie 中直接打开使用</p>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: colors.textPrimary, marginBottom: 4 }}>备注</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="备注信息，如：货运管理系统、物流调度平台"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <Button onClick={handleSave} disabled={saving} style={{ marginTop: 4 }}>
          {saving ? '保存中...' : editing ? '保存修改' : '添加合作方'}
        </Button>
      </div>
    </Modal>
  )
}
