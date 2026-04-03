import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit3, Trash2, Users, Check, X as XIcon } from 'lucide-react'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import { projectApi } from '../services/api'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'

const PROJECT_PERMISSIONS = [
  { key: 'can_edit_project', label: '编辑项目', desc: '修改项目名称/描述/状态' },
  { key: 'can_delete_project', label: '删除项目', desc: '删除项目' },
  { key: 'can_set_client', label: '设置客户企业', desc: '设置/更换客户企业' },
  { key: 'can_add_member', label: '添加成员', desc: '添加内部成员' },
  { key: 'can_remove_member', label: '移除成员', desc: '移除内部成员' },
  { key: 'can_update_member_role', label: '更新成员角色', desc: '更改成员角色' },
  { key: 'can_manage_client_member', label: '管理客户方成员', desc: '添加/移除客户方成员' },
  { key: 'can_approve_join', label: '审批加入申请', desc: '审批/拒绝加入申请' },
  { key: 'can_manage_roles', label: '管理角色', desc: '创建/编辑/删除角色' },
  { key: 'can_create_task', label: '创建任务', desc: '创建新任务' },
  { key: 'can_delete_task', label: '删除任务', desc: '删除任务' },
  { key: 'can_manage_task_flow', label: '任务状态流转', desc: '接受/提交/审核等操作' },
  { key: 'can_manage_task_preset', label: '管理任务预设', desc: '管理任务标题预设' },
  { key: 'can_manage_milestone', label: '管理里程碑', desc: '创建/编辑/完成/删除里程碑' },
  { key: 'can_view_report', label: '查看报表', desc: '查看项目数据报表' },
  { key: 'can_manage_app', label: '管理应用', desc: '添加/编辑/移除关联应用' },
] as const

const ROLE_COLORS = ['#2563eb', '#9333ea', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#64748b']

const emptyForm: Record<string, any> = { name: '', color: '#2563eb', ...Object.fromEntries(PROJECT_PERMISSIONS.map(p => [p.key, false])) }

interface Props {
  projectId: string
  canEdit: boolean
}

export default function ProjectRoleList({ projectId, canEdit }: Props) {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const loadRoles = useCallback(async () => {
    const r = await projectApi.listRoles(projectId)
    if (r.success) setRoles(r.data || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { loadRoles() }, [loadRoles])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const openEdit = (r: any) => {
    setEditing(r)
    setForm({
      name: r.name || '', color: r.color || '#64748b',
      ...Object.fromEntries(PROJECT_PERMISSIONS.map(p => [p.key, !!r[p.key]])),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('请输入角色名称', 'error'); return }
    setSaving(true)
    try {
      const r = editing
        ? await projectApi.updateRole(projectId, editing.id, form)
        : await projectApi.createRole(projectId, form)
      if (r.success) {
        toast(editing ? '角色已更新' : '角色已创建', 'success')
        setModalOpen(false)
        loadRoles()
      } else toast(r.message || '操作失败', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async (roleId: number) => {
    if (!(await confirm({ message: '确定删除该角色？', danger: true }))) return
    const r = await projectApi.removeRole(projectId, roleId)
    if (r.success) { toast('角色已删除', 'success'); loadRoles() }
    else toast(r.message || '删除失败', 'error')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>加载中...</div>

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>项目角色</h3>
        {canEdit && <Button onClick={openCreate}><Plus size={14} /> 新建角色</Button>}
      </div>

      {roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无自定义角色</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {roles.map((r: any) => (
            <div key={r.id} style={{ border: '1px solid var(--border-primary)', borderRadius: 10, padding: 16, borderLeft: `3px solid ${r.color || '#64748b'}` }}>
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
                    {!r.is_default && <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2, display: 'flex' }}><Trash2 size={13} /></button>}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PROJECT_PERMISSIONS.map(p => {
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑项目角色' : '新建项目角色'} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="角色名称 *" placeholder="如：项目经理、开发负责人" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

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
              {PROJECT_PERMISSIONS.map(p => (
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
