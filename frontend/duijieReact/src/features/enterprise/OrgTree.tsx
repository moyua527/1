import { Building2, Building, Users, ChevronRight, ChevronDown } from 'lucide-react'
import Avatar from '../ui/Avatar'

interface Props {
  ent: any
  members: any[]
  departments: any[]
  expandedDepts: Set<number>
  toggleDept: (id: number) => void
}

export default function OrgTree({ ent, members, departments, expandedDepts, toggleDept }: Props) {
  const rootDepts = departments.filter((d: any) => !d.parent_id)
  const childDepts = (pid: number) => departments.filter((d: any) => d.parent_id === pid)
  const deptMembers = (did: number) => members.filter((m: any) => m.department_id === did)
  const unassigned = members.filter((m: any) => !m.department_id)

  const renderDept = (dept: any, level: number) => {
    const children = childDepts(dept.id)
    const mems = deptMembers(dept.id)
    const expanded = expandedDepts.has(dept.id)
    const hasContent = children.length > 0 || mems.length > 0
    return (
      <div key={dept.id}>
        <div onClick={() => hasContent && toggleDept(dept.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', paddingLeft: 12 + level * 24, cursor: hasContent ? 'pointer' : 'default', borderRadius: 8, background: expanded ? 'var(--bg-secondary)' : 'transparent' }}>
          {hasContent ? (expanded ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronRight size={14} color="var(--text-secondary)" />) : <span style={{ width: 14 }} />}
          <Building size={16} color="var(--brand)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{dept.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({mems.length}人)</span>
        </div>
        {expanded && (
          <>
            {mems.map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', paddingLeft: 36 + level * 24 }}>
                <Avatar name={m.name} size={24} />
                <span style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>{m.name}</span>
                {m.position && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {m.position}</span>}
                {m.employee_id && <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>#{m.employee_id}</span>}
              </div>
            ))}
            {children.map((c: any) => renderDept(c, level + 1))}
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border-primary)', marginBottom: 8 }}>
        <Building2 size={18} color="#1d4ed8" />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{ent.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({members.length}人)</span>
      </div>
      {rootDepts.map((d: any) => renderDept(d, 0))}
      {unassigned.length > 0 && (
        <div>
          <div onClick={() => toggleDept(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', cursor: 'pointer', borderRadius: 8, background: expandedDepts.has(-1) ? 'var(--bg-secondary)' : 'transparent' }}>
            {expandedDepts.has(-1) ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronRight size={14} color="var(--text-secondary)" />}
            <Users size={16} color="#94a3b8" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>未分配部门</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({unassigned.length}人)</span>
          </div>
          {expandedDepts.has(-1) && unassigned.map((m: any) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', paddingLeft: 36 }}>
              <Avatar name={m.name} size={24} />
              <span style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>{m.name}</span>
              {m.position && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {m.position}</span>}
            </div>
          ))}
        </div>
      )}
      {departments.length === 0 && members.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: 14 }}>请先创建部门并添加成员</div>
      )}
    </div>
  )
}
