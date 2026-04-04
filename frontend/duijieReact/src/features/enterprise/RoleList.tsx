import { useState } from 'react'
import { Plus, Edit3, Trash2, Users, Check } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { section, ENT_PERM_GROUPS, ALL_ENT_PERM_KEYS, ROLE_COLORS, emptyRoleForm } from './constants'

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
      name: r.name || '', color: r.color || '#64748b',
      ...Object.fromEntries(ALL_ENT_PERM_KEYS.map(k => [k, !!r[k]])),
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
                {ENT_PERM_GROUPS.flatMap(g => g.items.filter(p => !!r[p.key]).map(p => (
                  <span key={p.key} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3,
                    background: '#f0fdf4', color: 'var(--color-success)' }}>
                    <Check size={10} /> {p.label}
                  </span>
                )))}
                {ALL_ENT_PERM_KEYS.every(k => !r[k]) && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>无权限</span>}
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 6, marginBottom: 10 }}>权限设置（{ALL_ENT_PERM_KEYS.filter(k => (form as any)[k]).length}/{ALL_ENT_PERM_KEYS.length}）</label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
              <button onClick={() => setForm({ ...form, ...Object.fromEntries(ALL_ENT_PERM_KEYS.map(k => [k, true])) })} style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>全选</button>
              <button onClick={() => setForm({ ...form, ...Object.fromEntries(ALL_ENT_PERM_KEYS.map(k => [k, false])) })} style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>全不选</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              {ENT_PERM_GROUPS.map(group => {
                const allOn = group.items.every(p => (form as any)[p.key])
                return (
                  <div key={group.title}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{group.title}</span>
                      <button onClick={() => { const val = !allOn; setForm({ ...form, ...Object.fromEntries(group.items.map(p => [p.key, val])) }) }}
                        style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>{allOn ? '取消全选' : '全选'}</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {group.items.map(p => {
                        const on = !!(form as any)[p.key]
                        return (
                          <button key={p.key} onClick={() => setForm({ ...form, [p.key]: !on })}
                            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 3,
                              borderColor: on ? 'var(--brand)' : 'var(--border-primary)', background: on ? '#eff6ff' : 'var(--bg-primary)', color: on ? 'var(--brand)' : 'var(--text-secondary)' }}>
                            {on && <Check size={10} />}<span>{p.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
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
