import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Clock, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { milestoneApi } from '../../milestone/services/api'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import MilestoneDetailModal from './MilestoneDetailModal'

const section: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

const TEMPLATES = [
  { name: '软件开发 (SDLC)', stages: ['需求分析', '系统设计', '开发编码', '测试验证', '部署上线', '运维维护'] },
  { name: '项目管理', stages: ['立项规划', '执行推进', '交付验收', '收尾总结'] },
  { name: '产品迭代', stages: ['需求调研', '原型设计', '开发实现', '内测优化', '正式发布'] },
]

interface MilestoneTabProps {
  milestones: any[]
  projectId: string
  canEdit: boolean
  onRefresh: () => void
  isMobile?: boolean
  members?: any[]
  currentUserId?: number
  remarkMap?: Record<string, string>
}

export default function MilestoneTab({ milestones, projectId, canEdit, onRefresh, isMobile, members = [], currentUserId = 0, remarkMap = {} }: MilestoneTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', due_date: '' })
  const [showTemplates, setShowTemplates] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const sorted = [...milestones].sort((a, b) => {
    if (a.is_completed && !b.is_completed) return -1
    if (!a.is_completed && b.is_completed) return 1
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const completed = sorted.filter(m => m.is_completed).length
  const total = sorted.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleSave = async () => {
    if (!form.title.trim()) { toast('请输入阶段名称', 'error'); return }
    const r = editing
      ? await milestoneApi.update(String(editing.id), form)
      : await milestoneApi.create({ project_id: Number(projectId), ...form })
    if (r.success) {
      toast(editing ? '已更新' : '阶段已创建', 'success')
      if (!editing) window.dispatchEvent(new CustomEvent('onboarding-done', { detail: { type: 'set_milestone' } }))
      setShowForm(false); setEditing(null); setForm({ title: '', description: '', due_date: '' }); onRefresh()
    } else toast(r.message || '操作失败', 'error')
  }

  const handleTemplate = async (stages: string[]) => {
    setShowTemplates(false)
    for (const title of stages) {
      await milestoneApi.create({ project_id: Number(projectId), title, description: '', due_date: '' })
    }
    toast(`已创建 ${stages.length} 个阶段`, 'success')
    onRefresh()
  }

  return (
    <div style={section}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>代办</h3>
          {total > 0 && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>进度 {completed}/{total}</span>}
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 6 }}>
            {total === 0 && (
              <div style={{ position: 'relative' }}>
                <Button variant="secondary" onClick={() => setShowTemplates(v => !v)}>模板</Button>
                {showTemplates && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowTemplates(false)} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 220, overflow: 'hidden' }}>
                      {TEMPLATES.map(t => (
                        <button key={t.name} onClick={() => handleTemplate(t.stages)}
                          style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <div style={{ fontWeight: 500, color: 'var(--text-heading)' }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.stages.join(' → ')}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <Button onClick={() => { setEditing(null); setForm({ title: '', description: '', due_date: '' }); setShowForm(!showForm) }}>
              <Plus size={14} /> 新增
            </Button>
          </div>
        )}
      </div>

      {total > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: progress === 100 ? '#22c55e' : 'var(--brand)', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: progress === 100 ? '#22c55e' : 'var(--brand)', minWidth: 36, textAlign: 'right' }}>{progress}%</span>
          </div>

          {!isMobile && total <= 8 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
              {sorted.map((m, i) => {
                const isActive = !m.is_completed && (i === 0 || sorted[i - 1]?.is_completed)
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: m.is_completed ? '#22c55e' : isActive ? 'var(--brand)' : 'var(--bg-tertiary)',
                        color: m.is_completed || isActive ? '#fff' : 'var(--text-tertiary)',
                        boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.2)' : 'none', transition: 'all 0.2s' }}>
                        {m.is_completed ? <CheckCircle2 size={16} /> : isActive ? <Clock size={14} /> : <Circle size={14} />}
                      </div>
                      <span style={{ fontSize: 10, color: m.is_completed ? '#22c55e' : isActive ? 'var(--brand)' : 'var(--text-tertiary)', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                        {m.title}
                      </span>
                    </div>
                    {i < sorted.length - 1 && (
                      <div style={{ width: 20, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -16 }}>
                        <ChevronRight size={14} color={sorted[i + 1]?.is_completed || (isActive && sorted[i + 1]) ? 'var(--brand)' : 'var(--border-primary)'} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' as any }}>
            <div style={{ flex: 2, minWidth: isMobile ? '100%' : 'auto' }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>阶段名称</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例如：需求分析、开发编码"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>目标日期</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="描述（可选）" rows={2}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>取消</Button>
            <Button onClick={handleSave}>{editing ? '保存修改' : '创建'}</Button>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>暂无代办阶段</div>
          {canEdit && <div style={{ fontSize: 12 }}>点击「新增」添加阶段，或使用「模板」快速创建</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {sorted.map((m, i) => {
            const isActive = !m.is_completed && (i === 0 || sorted[i - 1]?.is_completed)
            const overdue = m.due_date && new Date(m.due_date) < new Date() && !m.is_completed
            const borderColor = m.is_completed ? '#22c55e' : isActive ? 'var(--brand)' : 'var(--border-primary)'
            return (
              <div key={m.id}
                style={{ position: 'relative', padding: '16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  background: 'var(--bg-secondary)', border: `1px solid ${borderColor}`,
                  borderTop: `3px solid ${borderColor}`,
                  boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.1)' : '0 1px 3px rgba(0,0,0,0.04)' }}
                onClick={() => setDetailId(String(m.id))}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = isActive ? '0 2px 8px rgba(59,130,246,0.1)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ cursor: canEdit ? 'pointer' : 'default', flexShrink: 0 }}
                    onClick={canEdit ? (e) => { e.stopPropagation(); milestoneApi.toggle(String(m.id)).then(() => onRefresh()) } : undefined}>
                    {m.is_completed ? <CheckCircle2 size={22} color="#22c55e" /> : isActive ? <Clock size={22} color="var(--brand)" /> : <Circle size={22} color="#cbd5e1" />}
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {canEdit && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setEditing(m); setForm({ title: m.title || '', description: m.description || '', due_date: m.due_date ? m.due_date.slice(0, 10) : '' }); setShowForm(true) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-heading)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}><Pencil size={14} /></button>
                        <button onClick={async (e) => { e.stopPropagation(); const r = await milestoneApi.remove(String(m.id)); if (r.success) { toast('已删除', 'success'); onRefresh() } else toast(r.message || '删除失败', 'error') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#dc2626'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: m.is_completed ? 'var(--text-tertiary)' : 'var(--text-heading)', textDecoration: m.is_completed ? 'line-through' : 'none', marginBottom: 6, lineHeight: 1.4 }}>
                  {m.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: m.description ? 8 : 0 }}>
                  {isActive && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--brand)', color: '#fff', fontWeight: 600 }}>进行中</span>}
                  {!!m.is_completed && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>已完成</span>}
                  {!!overdue && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>已逾期</span>}
                  {!isActive && !m.is_completed && !overdue && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 500 }}>待开始</span>}
                </div>
                {m.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{m.description}</div>}
                {m.due_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: overdue ? '#dc2626' : 'var(--text-tertiary)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-primary)' }}>
                    <Clock size={12} />
                    目标: {m.due_date.slice(0, 10)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {detailId && (
        <MilestoneDetailModal
          milestoneId={detailId}
          currentUserId={currentUserId}
          members={members}
          remarkMap={remarkMap}
          onClose={() => setDetailId(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}
