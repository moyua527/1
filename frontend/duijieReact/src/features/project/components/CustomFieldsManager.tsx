import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { projectApi } from '../services/api'
import { toast } from '../../ui/Toast'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'

const FIELD_TYPES: { value: string; label: string }[] = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'amount', label: '金额' },
  { value: 'select', label: '单选' },
  { value: 'multi_select', label: '多选' },
]

const typeLabel = (t: string) => FIELD_TYPES.find(f => f.value === t)?.label || t

interface CustomField {
  id: number
  name: string
  field_type: string
  options: string[]
  required: boolean
  sort_order: number
}

export default function CustomFieldsManager({ projectId }: { projectId: string }) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', field_type: 'text', options: '' as string, required: false })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const r = await projectApi.listCustomFields(projectId)
    if (r.success) setFields(r.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleAdd = async () => {
    if (!form.name.trim()) { toast('请输入字段名称', 'error'); return }
    setSaving(true)
    const opts = ['select', 'multi_select'].includes(form.field_type)
      ? form.options.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)
      : undefined
    const r = await projectApi.createCustomField(projectId, {
      name: form.name.trim(),
      field_type: form.field_type,
      options: opts,
      required: form.required,
    })
    setSaving(false)
    if (r.success) {
      toast('字段已添加', 'success')
      setShowAdd(false)
      setForm({ name: '', field_type: 'text', options: '', required: false })
      load()
    } else {
      toast(r.message || '添加失败', 'error')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定删除字段「${name}」？已填写的数据将被清除。`)) return
    const r = await projectApi.deleteCustomField(id)
    if (r.success) { toast('已删除', 'success'); load() }
    else toast(r.message || '删除失败', 'error')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border-primary)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-secondary)', color: 'var(--text-heading)',
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>加载中...</div>

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>扩展属性</h3>
        <Button onClick={() => setShowAdd(true)}><Plus size={14} /> 添加字段</Button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
        为本项目的需求添加自定义字段（日期、金额、单选等）
      </div>

      {fields.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 14 }}>
          暂无自定义字段，点击「添加字段」开始
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fields.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <GripVertical size={16} color="var(--text-tertiary)" style={{ flexShrink: 0, cursor: 'grab' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {f.name}
                  {f.required && <span style={{ fontSize: 11, color: '#ef4444' }}>必填</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{typeLabel(f.field_type)}</span>
                  {f.options?.length > 0 && <span>选项: {f.options.join(', ')}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(f.id, f.name)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="添加自定义字段">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: 'var(--text-body)' }}>字段名称 *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如：预算金额、交付日期" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: 'var(--text-body)' }}>字段类型</label>
            <select value={form.field_type} onChange={e => setForm({ ...form, field_type: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {['select', 'multi_select'].includes(form.field_type) && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: 'var(--text-body)' }}>选项（每行一个或逗号分隔）</label>
              <textarea value={form.options} onChange={e => setForm({ ...form, options: e.target.value })}
                placeholder="选项1&#10;选项2&#10;选项3"
                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-body)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.required} onChange={e => setForm({ ...form, required: e.target.checked })} />
            必填字段
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? '添加中...' : '确定'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
