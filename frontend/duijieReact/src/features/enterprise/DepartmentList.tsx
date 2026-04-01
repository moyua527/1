import { Building, Plus, Edit3, Trash2, MoreHorizontal } from 'lucide-react'
import Button from '../ui/Button'
import { section } from './constants'

interface Props {
  departments: any[]
  members: any[]
  canAdmin: boolean
  deptMenuId: number | null
  setDeptMenuId: (id: number | null) => void
  openAddDept: (parentId?: number) => void
  openEditDept: (d: any) => void
  handleDeleteDept: (id: number) => void
}

export default function DepartmentList({ departments, members, canAdmin, deptMenuId, setDeptMenuId, openAddDept, openEditDept, handleDeleteDept }: Props) {
  return (
    <div style={{ ...section, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
      {canAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={() => openAddDept()}><Plus size={14} /> 添加部门</Button>
        </div>
      )}
      {departments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>暂无部门，点击"添加部门"创建组织结构</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {departments.filter((d: any) => !d.parent_id).map((dept: any) => {
            const children = departments.filter((d: any) => d.parent_id === dept.id)
            const memberCount = members.filter((m: any) => m.department_id === dept.id).length
            return (
              <div key={dept.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid var(--border-primary)', borderRadius: 10, background: '#fafbfc' }}>
                  <Building size={18} color="var(--brand)" />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{dept.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{memberCount}人</span>
                  {canAdmin && (
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setDeptMenuId(deptMenuId === dept.id ? null : dept.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, display: 'flex' }}><MoreHorizontal size={16} /></button>
                      {deptMenuId === dept.id && (
                        <>
                          <div onClick={() => setDeptMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 50, minWidth: 130, overflow: 'hidden' }}>
                            <button onClick={() => { setDeptMenuId(null); openAddDept(dept.id) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-body)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                              <Plus size={13} color="var(--brand)" /> 添加子部门
                            </button>
                            <button onClick={() => { setDeptMenuId(null); openEditDept(dept) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-body)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                              <Edit3 size={13} color="var(--text-secondary)" /> 编辑部门
                            </button>
                            <div style={{ height: 1, background: 'var(--bg-tertiary)' }} />
                            <button onClick={() => { setDeptMenuId(null); handleDeleteDept(dept.id) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-danger)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                              <Trash2 size={13} /> 删除部门
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {children.length > 0 && (
                  <div style={{ marginLeft: 28, borderLeft: '2px solid var(--border-primary)', paddingLeft: 12, marginTop: 4 }}>
                    {children.map((child: any) => {
                      const childCount = members.filter((m: any) => m.department_id === child.id).length
                      return (
                        <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--border-secondary)', borderRadius: 8, marginBottom: 4, background: 'var(--bg-primary)' }}>
                          <Building size={14} color="var(--text-secondary)" />
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-body)' }}>{child.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{childCount}人</span>
                          {canAdmin && (
                            <div style={{ position: 'relative' }}>
                              <button onClick={() => setDeptMenuId(deptMenuId === child.id ? null : child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, display: 'flex' }}><MoreHorizontal size={14} /></button>
                              {deptMenuId === child.id && (
                                <>
                                  <div onClick={() => setDeptMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 50, minWidth: 120, overflow: 'hidden' }}>
                                    <button onClick={() => { setDeptMenuId(null); openEditDept(child) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-body)' }}
                                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                      <Edit3 size={13} color="var(--text-secondary)" /> 编辑
                                    </button>
                                    <div style={{ height: 1, background: 'var(--bg-tertiary)' }} />
                                    <button onClick={() => { setDeptMenuId(null); handleDeleteDept(child.id) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-danger)' }}
                                      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                      <Trash2 size={13} /> 删除
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
