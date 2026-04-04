import { useState } from 'react'
import { Plus, Edit3, Trash2, Users, Check, X as XIcon } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { section, ENTERPRISE_PERMISSIONS, ROLE_COLORS, emptyRoleForm } from './constants'

interface Props {
  roles: any[]
  isOwner: boolean
  canManageRoles: boolean
  onCreateRole: (form: any) => Promise<void>
  onUpdateRole: (id: number, form: any) => Promise<void>
  onDeleteRole: (id: number) => Promise<void>
}

export default function RoleList({ roles, isOwner, canManageRoles, onCreateRole, onUpdateRole, onDeleteRole }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyRoleForm })
  const [saving, setSaving] = useState(false)
  const canEdit = isOwner || canManageRoles

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyRoleForm })
    setModalOpen(true)
  }

  const openEdit = (r: any) => {
    setEditing(r)
    setForm({
      name: r.name || '', color: r.color || 'var(--text-secondary)',
      ...Object.fromEntries(ENTERPRISE_PERMISSIONS.map(p => [p.key, !!r[p.key]])),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) await onUpdateRole(editing.id, form)
      else await onCreateRole(form)
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={openCreate}><Plus size={14} /> 新建角色</Button>
        </div>
      )}

      {roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无角色</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {roles.map((r: any) => (
            <div key={r.id} style={{ border: '1px solid var(--border-primary)', borderRadius: 10, padding: 16, borderLeft: `3px solid ${r.color || 'var(--text-secondary)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{r.name}</span>
                  {r.is_default ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>默认</span> : null}
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Users size={11} /> {r.member_count || 0}人
                  </span>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2, display: 'flex' }}><Edit3 size={13} /></button>
                    {!r.is_default && <button onClick={() => onDeleteRole(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2, display: 'flex' }}><Trash2 size={13} /></button>}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ENTERPRISE_PERMISSIONS.map(p => {
                  const on = !!r[p.key]
                  return (
                    <span key={p.key} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3,
                      background: on ? '#f0fdf4' : '#fef2f2', color: on ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {on ? <Check size={10} /> : <XIcon size={10} />} {p.label}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑角色' : '新建角色'} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="角色名称 *" placeholder="如：项目经理" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 6 }}>角色颜色</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {ROLE_COLORS.map(c => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text-heading)' : '2px solid var(--border-primary)', cursor: 'pointer', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 6, marginBottom: 10 }}>权限设置</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ENTERPRISE_PERMISSIONS.map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', cursor: 'pointer', transition: 'all 0.15s', background: (form as any)[p.key] ? '#f0fdf4' : 'var(--bg-primary)' }}
                  onClick={() => setForm({ ...form, [p.key]: !(form as any)[p.key] })}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)' }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.desc}</div>
                  </div>
                  <div style={{ width: 40, height: 22, borderRadius: 11, background: (form as any)[p.key] ? 'var(--brand)' : 'var(--text-disabled)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-primary)', position: 'absolute', top: 2, left: (form as any)[p.key] ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
