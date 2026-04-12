import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Clock, Trash2, Edit3, BarChart3 } from 'lucide-react'
import { timesheetApi } from './api'
import { useProjects, useTasks } from '../../hooks/useApi'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'

const today = () => new Date().toISOString().slice(0, 10)

export default function TimesheetPage() {
  const { isMobile } = useOutletContext<{ user: any; isMobile?: boolean }>()
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ project_id: '', task_id: '', work_date: today(), hours: '1', description: '' })
  const [filterProject, setFilterProject] = useState('')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week')

  const { data: projects = [] } = useProjects()
  const { data: tasks = [] } = useTasks(form.project_id || undefined)

  const getDateRange = (): Record<string, string> => {
    const now = new Date()
    if (dateRange === 'week') {
      const start = new Date(now); start.setDate(start.getDate() - 7)
      return { start_date: start.toISOString().slice(0, 10), end_date: now.toISOString().slice(0, 10) }
    }
    if (dateRange === 'month') {
      const start = new Date(now); start.setDate(start.getDate() - 30)
      return { start_date: start.toISOString().slice(0, 10), end_date: now.toISOString().slice(0, 10) }
    }
    return {}
  }

  const load = useCallback(async () => {
    setLoading(true)
    const params: Record<string, string> = { ...getDateRange() }
    if (filterProject) params.project_id = filterProject
    const r = await timesheetApi.list(params)
    if (r.success) setRecords(r.data)
    setLoading(false)
  }, [filterProject, dateRange])

  const loadSummary = useCallback(async () => {
    const params: Record<string, string> = { ...getDateRange() }
    if (filterProject) params.project_id = filterProject
    const r = await timesheetApi.summary(params)
    if (r.success) setSummary(r.data)
  }, [filterProject, dateRange])

  useEffect(() => { load() }, [load])

  const handleSubmit = async () => {
    if (!form.project_id || !form.work_date || !form.hours) { toast('请填写必填项', 'error'); return }
    const h = parseFloat(form.hours)
    if (isNaN(h) || h <= 0 || h > 24) { toast('工时必须在0.5-24之间', 'error'); return }
    const data = { project_id: Number(form.project_id), task_id: form.task_id ? Number(form.task_id) : undefined, work_date: form.work_date, hours: h, description: form.description }
    const r = editId ? await timesheetApi.update(editId, data) : await timesheetApi.create(data)
    if (r.success) { toast(editId ? '已更新' : '已记录', 'success'); setShowForm(false); setEditId(null); resetForm(); load() }
    else toast(r.message || '操作失败', 'error')
  }

  const resetForm = () => setForm({ project_id: '', task_id: '', work_date: today(), hours: '1', description: '' })

  const handleEdit = (rec: any) => {
    setForm({ project_id: String(rec.project_id), task_id: rec.task_id ? String(rec.task_id) : '', work_date: rec.work_date?.slice(0, 10), hours: String(rec.hours), description: rec.description || '' })
    setEditId(rec.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!(await confirm({ message: '确定删除这条工时记录？' }))) return
    const r = await timesheetApi.remove(id)
    if (r.success) { toast('已删除', 'success'); load() } else toast(r.message || '删除失败', 'error')
  }

  const totalHours = records.reduce((s, r) => s + Number(r.hours), 0)
  const grouped = records.reduce<Record<string, any[]>>((acc, r) => {
    const d = r.work_date?.slice(0, 10) || 'unknown'
    if (!acc[d]) acc[d] = []
    acc[d].push(r)
    return acc
  }, {})

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }

  return (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', height: '100%', margin: '-20px -16px', padding: 0 } : undefined}>
      {isMobile ? (
        <div style={{ flexShrink: 0, background: 'var(--bg-secondary)', padding: '14px 16px 10px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 10px', textAlign: 'center' }}>工时汇报</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 8 }}>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, color: filterProject ? 'var(--text-heading)' : 'var(--text-tertiary)', background: 'var(--bg-primary)' }}>
              <option value="">全部项目</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => { setShowSummary(true); loadSummary() }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
              <BarChart3 size={14} /> 统计
            </button>
            <button onClick={() => { resetForm(); setEditId(null); setShowForm(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>
              <Plus size={14} /> 记录
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['week', 'month', 'all'] as const).map(k => (
              <button key={k} onClick={() => setDateRange(k)}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: dateRange === k ? 'var(--brand)' : 'var(--bg-primary)', color: dateRange === k ? '#fff' : 'var(--text-secondary)' }}>
                {{ week: '近7天', month: '近30天', all: '全部' }[k]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '6px 0 0' }}>
            共 {records.length} 条 · {totalHours.toFixed(1)} 小时
          </div>
        </div>
      ) : (
        <PageHeader title="工时汇报" subtitle={`共 ${records.length} 条记录 · ${totalHours.toFixed(1)} 小时`}
          actions={<div style={{ display: 'flex', gap: 8 }}>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, color: filterProject ? 'var(--text-heading)' : 'var(--text-tertiary)' }}>
              <option value="">全部项目</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={dateRange} onChange={e => setDateRange(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13 }}>
              <option value="week">近7天</option>
              <option value="month">近30天</option>
              <option value="all">全部</option>
            </select>
            <Button onClick={() => { setShowSummary(true); loadSummary() }}><BarChart3 size={14} /> 统计</Button>
            <Button onClick={() => { resetForm(); setEditId(null); setShowForm(true) }}><Plus size={14} /> 记录工时</Button>
          </div>}
        />
      )}

      <div style={isMobile ? { flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 16px 16px', WebkitOverflowScrolling: 'touch' as any } : undefined}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-disabled)' }}>加载中...</div>
        ) : records.length === 0 ? (
          <EmptyState icon={Clock} title="暂无工时记录" subtitle="点击「记录工时」开始" />
        ) : (
          Object.entries(grouped).map(([date, recs]) => (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 0 6px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{date} ({['日','一','二','三','四','五','六'][new Date(date).getDay()]})</span>
                <span>{recs.reduce((s: number, r: any) => s + Number(r.hours), 0).toFixed(1)}h</span>
              </div>
              {recs.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.project_name}{r.task_title ? ` · ${r.task_title}` : ''}
                    </div>
                    {r.description && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
                    {!isMobile && r.user_name && <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>{r.user_name}</div>}
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{Number(r.hours).toFixed(1)}h</span>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button onClick={() => handleEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* 记录/编辑弹窗 */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditId(null) }} title={editId ? '编辑工时' : '记录工时'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>项目 *</label>
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value, task_id: '' }))} style={inp}>
              <option value="">选择项目</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {form.project_id && tasks.length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>关联需求</label>
              <select value={form.task_id} onChange={e => setForm(f => ({ ...f, task_id: e.target.value }))} style={inp}>
                <option value="">不关联</option>
                {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>日期 *</label>
              <input type="date" value={form.work_date} onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>工时(小时) *</label>
              <input type="number" min="0.5" max="24" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>工作描述</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="描述本次工作内容..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 13, cursor: 'pointer' }}>取消</button>
            <button onClick={handleSubmit}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{editId ? '保存' : '提交'}</button>
          </div>
        </div>
      </Modal>

      {/* 统计弹窗 */}
      <Modal open={showSummary} onClose={() => setShowSummary(false)} title="工时统计">
        {summary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '12px 0', background: 'var(--bg-selected)', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)' }}>{summary.grandTotal.toFixed(1)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>总工时（小时）</div>
            </div>
            {summary.byProject?.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>按项目</div>
                {summary.byProject.map((p: any) => (
                  <div key={p.project_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-body)' }}>{p.project_name || '未知项目'}</span>
                    <span style={{ fontWeight: 600, color: 'var(--brand)' }}>{Number(p.total_hours).toFixed(1)}h ({p.record_count}条)</span>
                  </div>
                ))}
              </div>
            )}
            {summary.byUser?.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>按成员</div>
                {summary.byUser.map((u: any) => (
                  <div key={u.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-body)' }}>{u.user_name || '未知'}</span>
                    <span style={{ fontWeight: 600, color: 'var(--brand)' }}>{Number(u.total_hours).toFixed(1)}h ({u.record_count}条)</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowSummary(false)}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 13, cursor: 'pointer', alignSelf: 'flex-end' }}>关闭</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-disabled)' }}>加载中...</div>
        )}
      </Modal>
    </div>
  )
}
