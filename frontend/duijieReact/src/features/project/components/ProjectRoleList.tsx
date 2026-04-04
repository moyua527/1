import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit3, Trash2, Users, Check } from 'lucide-react'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import { projectApi } from '../services/api'
import { toast } from '../../ui/Toast'
import { confirm } from '../../ui/ConfirmDialog'

const PERM_GROUPS = [
  { title: '项目信息管理', items: [
    { key: 'can_edit_project_name', label: '修改名称' },
    { key: 'can_edit_project_desc', label: '修改描述' },
    { key: 'can_edit_project_status', label: '修改状态' },
    { key: 'can_delete_project', label: '删除项目' },
  ]},
  { title: '关联客户企业', items: [
    { key: 'can_send_client_request', label: '发起关联请求' },
    { key: 'can_cancel_client_link', label: '取消关联' },
    { key: 'can_change_client_link', label: '变更企业' },
  ]},
  { title: '我方成员管理', items: [
    { key: 'can_add_member', label: '添加成员' },
    { key: 'can_assign_member_legacy_role', label: '指定遗留角色' },
    { key: 'can_assign_member_ent_role', label: '分配企业角色' },
    { key: 'can_assign_member_proj_role', label: '分配项目角色' },
    { key: 'can_remove_member', label: '移除成员' },
  ]},
  { title: '修改成员角色', items: [
    { key: 'can_update_member_legacy_role', label: '改遗留角色' },
    { key: 'can_update_member_ent_role', label: '改企业角色' },
    { key: 'can_update_member_proj_role', label: '改项目角色' },
  ]},
  { title: '客户方成员', items: [
    { key: 'can_view_client_users', label: '查看可用用户' },
    { key: 'can_add_client_member', label: '添加客户方成员' },
    { key: 'can_remove_client_member', label: '移除客户方成员' },
  ]},
  { title: '加入审批', items: [
    { key: 'can_view_join_requests', label: '查看申请列表' },
    { key: 'can_approve_join', label: '批准加入' },
    { key: 'can_reject_join', label: '拒绝加入' },
  ]},
  { title: '角色管理', items: [
    { key: 'can_create_role', label: '创建角色' },
    { key: 'can_edit_role_name', label: '编辑名称' },
    { key: 'can_edit_role_color', label: '编辑颜色' },
    { key: 'can_edit_role_perms', label: '编辑权限' },
    { key: 'can_delete_role', label: '删除角色' },
  ]},
  { title: '任务创建', items: [
    { key: 'can_create_task', label: '创建任务' },
    { key: 'can_create_task_with_attachment', label: '创建时上传附件' },
  ]},
  { title: '任务删除与恢复', items: [
    { key: 'can_delete_task', label: '删除任务' },
    { key: 'can_view_task_trash', label: '查看回收站' },
    { key: 'can_restore_task', label: '恢复任务' },
  ]},
  { title: '任务状态流转', items: [
    { key: 'can_move_task_accept', label: '接受任务' },
    { key: 'can_move_task_dispute', label: '提疑问' },
    { key: 'can_move_task_supplement', label: '补充回复' },
    { key: 'can_move_task_submit_review', label: '提交验收' },
    { key: 'can_move_task_reject', label: '驳回验收' },
    { key: 'can_move_task_approve', label: '验收通过' },
    { key: 'can_move_task_resubmit', label: '重新验收' },
  ]},
  { title: '任务编辑', items: [
    { key: 'can_edit_task_title', label: '编辑标题' },
    { key: 'can_edit_task_desc', label: '编辑描述' },
    { key: 'can_edit_task_priority', label: '编辑优先级' },
    { key: 'can_edit_task_deadline', label: '编辑截止日期' },
    { key: 'can_assign_task', label: '指派负责人' },
  ]},
  { title: '任务附件', items: [
    { key: 'can_upload_task_attachment', label: '上传附件' },
    { key: 'can_delete_task_attachment', label: '删除附件' },
  ]},
  { title: '审核要点', items: [
    { key: 'can_add_review_point', label: '添加要点' },
    { key: 'can_respond_review_point', label: '回复要点' },
    { key: 'can_confirm_review_point', label: '确认要点' },
  ]},
  { title: '任务预设标题', items: [
    { key: 'can_view_title_options', label: '查看选项' },
    { key: 'can_record_title_history', label: '记录历史' },
    { key: 'can_delete_title_history', label: '删除历史' },
    { key: 'can_edit_title_presets', label: '编辑模板' },
  ]},
  { title: '里程碑', items: [
    { key: 'can_create_milestone', label: '创建' },
    { key: 'can_edit_milestone', label: '编辑' },
    { key: 'can_delete_milestone', label: '删除' },
    { key: 'can_toggle_milestone', label: '切换完成' },
  ]},
  { title: '报表', items: [
    { key: 'can_view_report', label: '查看报表' },
    { key: 'can_export_data', label: '导出数据' },
  ]},
  { title: '应用/集成', items: [
    { key: 'can_manage_app_config', label: '应用配置' },
    { key: 'can_manage_app_integration', label: '集成设置' },
  ]},
] as const

const ALL_PERM_KEYS = PERM_GROUPS.flatMap(g => g.items.map(i => i.key))

const ROLE_COLORS = ['#2563eb', '#9333ea', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#64748b']

const emptyForm: Record<string, any> = { name: '', color: '#2563eb', ...Object.fromEntries(ALL_PERM_KEYS.map(k => [k, false])) }

interface Props {
  canEdit: boolean
}

export default function ProjectRoleList({ canEdit }: Props) {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const loadRoles = useCallback(async () => {
    const r = await projectApi.listEntRoles()
    if (r.success) setRoles(r.data || [])
    setLoading(false)
  }, [])

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
      ...Object.fromEntries(ALL_PERM_KEYS.map(k => [k, !!r[k]])),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('请输入角色名称', 'error'); return }
    setSaving(true)
    try {
      const r = editing
        ? await projectApi.updateEntRole(editing.id, form)
        : await projectApi.createEntRole(form)
      if (r.success) {
        toast(editing ? '角色已更新' : '角色已创建', 'success')
        setModalOpen(false)
        loadRoles()
      } else toast(r.message || '操作失败', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async (roleId: number) => {
    if (!(await confirm({ message: '确定删除该角色？', danger: true }))) return
    const r = await projectApi.removeEntRole(roleId)
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
        <>
          {/* 角色方块网格 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {roles.map((r: any) => {
              const permCount = ALL_PERM_KEYS.filter(k => !!r[k]).length
              const isSelected = expandedId === r.id
              return (
                <div key={r.id} onClick={() => setExpandedId(isSelected ? null : r.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 10,
                    border: isSelected ? `2px solid ${r.color || '#64748b'}` : '2px solid var(--border-primary)',
                    background: isSelected ? `${r.color || '#64748b'}08` : 'var(--bg-primary)',
                    cursor: 'pointer', transition: 'all 0.15s', minWidth: 90 }}>
                  {/* 色块圆圈 */}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: r.color || '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                    {r.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', textAlign: 'center', lineHeight: 1.2 }}>{r.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><Users size={10} />{r.member_count || 0}</span>
                    <span>{permCount}/{ALL_PERM_KEYS.length}</span>
                  </div>
                  {r.is_default ? <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>默认</span> : null}
                </div>
              )
            })}
          </div>

          {/* 选中角色的详情面板 */}
          {expandedId && (() => {
            const r = roles.find((x: any) => x.id === expandedId)
            if (!r) return null
            const permCount = ALL_PERM_KEYS.filter(k => !!r[k]).length
            return (
              <div style={{ marginTop: 12, border: '1px solid var(--border-primary)', borderRadius: 10, padding: 16, borderLeft: `3px solid ${r.color || '#64748b'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{r.name} — {permCount}/{ALL_PERM_KEYS.length} 权限</span>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2, display: 'flex' }}><Edit3 size={14} /></button>
                      {!r.is_default && <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2, display: 'flex' }}><Trash2 size={14} /></button>}
                    </div>
                  )}
                </div>
                {permCount === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>该角色暂无任何权限</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PERM_GROUPS.filter(g => g.items.some(p => !!r[p.key])).map(g => (
                      <div key={g.title}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{g.title}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {g.items.filter(p => !!r[p.key]).map(p => (
                            <span key={p.key} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f0fdf4', color: 'var(--color-success)' }}>
                              <Check size={10} /> {p.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 6, marginBottom: 10 }}>权限设置（{ALL_PERM_KEYS.filter(k => (form as any)[k]).length}/{ALL_PERM_KEYS.length}）</label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
              <button onClick={() => setForm({ ...form, ...Object.fromEntries(ALL_PERM_KEYS.map(k => [k, true])) })} style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>全选</button>
              <button onClick={() => setForm({ ...form, ...Object.fromEntries(ALL_PERM_KEYS.map(k => [k, false])) })} style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>全不选</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              {PERM_GROUPS.map(group => {
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
