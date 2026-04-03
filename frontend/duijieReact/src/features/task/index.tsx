import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { BACKEND_URL } from '../../bootstrap'
import { useTasks, useProjects, useInvalidate } from '../../hooks/useApi'
import useLiveData from '../../hooks/useLiveData'
import Badge from '../ui/Badge'
import { Plus, Paperclip, Download, Search } from 'lucide-react'
import TaskDetailModal from './components/TaskDetailModal'
import TaskCreateModal from './components/TaskCreateModal'
import { can } from '../../stores/permissions'


const columns = [
  { key: 'submitted', label: '已提出', color: 'var(--brand)', bg: 'var(--bg-selected)' },
  { key: 'disputed', label: '待补充', color: 'var(--color-warning)', bg: '#fffbeb' },
  { key: 'in_progress', label: '执行中', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'pending_review', label: '待验收', color: '#ea580c', bg: '#fff7ed' },
  { key: 'review_failed', label: '验收不通过', color: 'var(--color-danger)', bg: '#fef2f2' },
  { key: 'accepted', label: '验收通过', color: 'var(--color-success)', bg: '#f0fdf4' },
]

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'gray' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'yellow' },
  urgent: { label: '紧急', color: 'red' },
}

const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name)

export default function TaskBoard() {
  const { user } = useOutletContext<{ user: any }>()
  const canAddTask = can(user?.role || '', 'task:create')
  const [filterProject, setFilterProject] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  const { data: allTasks = [], isLoading: _tasksLoading } = useTasks(filterProject || undefined)
  const { data: projectsData = [] } = useProjects()
  const projects = projectsData
  const invalidate = useInvalidate()
  const reload = () => invalidate('tasks')

  useLiveData(['task'], () => invalidate('tasks'))

  const filtered = allTasks.filter(t => {
    if (searchText) {
      const s = searchText.toLowerCase()
      if (!(t.title || '').toLowerCase().includes(s) && !(t.assigned_name || '').toLowerCase().includes(s) && !(t.project_name || '').toLowerCase().includes(s)) return false
    }
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterStatus && t.status !== filterStatus) return false
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>任务看板</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
            共 {filtered.length} 个任务{filterProject ? '' : '（全部项目）'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索任务..."
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', width: 180 }} />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', color: filterProject ? 'var(--text-heading)' : 'var(--text-tertiary)' }}>
            <option value="">全部项目</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', color: filterPriority ? 'var(--text-heading)' : 'var(--text-tertiary)' }}>
            <option value="">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', color: filterStatus ? 'var(--text-heading)' : 'var(--text-tertiary)' }}>
            <option value="">全部状态</option>
            {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {canAddTask && (
            <button onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--brand)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <Plus size={14} /> 新建任务
            </button>
          )}
        </div>
      </div>

      {/* 卡片网格布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, paddingBottom: 8 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-disabled)', fontSize: 14 }}>暂无任务</div>
        )}
        {filtered.map(task => {
          const pr = priorityMap[task.priority] || priorityMap.medium
          const st = columns.find(c => c.key === task.status)
          const imgs = ((task as any).attachments || []).filter((a: any) => isImageFile(a.original_name || a.filename))
          const files = ((task as any).attachments || []).filter((a: any) => !isImageFile(a.original_name || a.filename))
          return (
            <div key={task.id} style={{
              background: 'var(--bg-primary)', borderRadius: 10, padding: 14,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer',
              border: '1px solid var(--border-primary)', transition: 'box-shadow 0.15s',
            }}
              onClick={() => setSelectedTask(task)}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
              {/* 标题 + 状态 */}
              <div style={{ display: 'flex', alignItems: 'start', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', flex: 1 }}>{task.title}</div>
                {st && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: st.bg, color: st.color, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, border: `1px solid ${st.color}30` }}>{st.label}</span>
                )}
              </div>
              {/* 描述内容 */}
              {task.description && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>{task.description}</div>
              )}
              {/* 项目名 + 优先级 + 负责人 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {task.project_name && !filterProject && (
                  <span style={{ fontSize: 11, color: 'var(--brand)', background: 'var(--bg-selected)', borderRadius: 4, padding: '1px 6px' }}>{task.project_name}</span>
                )}
                <Badge color={pr.color}>{pr.label}</Badge>
                {task.assigned_name && <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} />{task.assigned_name}</span>}
                {task.due_date && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>截止 {task.due_date.slice(0, 10)}</span>}
              </div>
              {/* 图片缩略图 */}
              {imgs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                  {imgs.map((a: any) => (
                    <img key={a.id} src={`${BACKEND_URL}/uploads/${a.filename}`} alt={a.original_name}
                      onClick={e => { e.stopPropagation(); setPreviewImg(`${BACKEND_URL}/uploads/${a.filename}`) }}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-primary)', display: 'block', cursor: 'pointer' }} />
                  ))}
                </div>
              )}
              {/* 非图片附件 */}
              {files.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {files.map((a: any) => (
                    <a key={a.id} href={`${BACKEND_URL}/uploads/${a.filename}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', fontSize: 10, color: 'var(--text-body)', textDecoration: 'none' }}>
                      <Paperclip size={9} color="var(--text-secondary)" /> {a.original_name} <Download size={9} color="var(--brand)" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <TaskDetailModal
        task={selectedTask}
        projectId={selectedTask ? String(selectedTask.project_id) : ''}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={reload}
      />

      <TaskCreateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={reload} projects={projects} />

      {/* 图片预览 */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', padding: 24 }}>
          <img src={previewImg} alt="预览" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setPreviewImg(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>✕</button>
        </div>
      )}
    </div>
  )
}
