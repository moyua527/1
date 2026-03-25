import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { fetchApi } from '../../bootstrap'
import { taskApi } from './services/api'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { Plus, GripVertical, Paperclip, Download, Search, Filter } from 'lucide-react'
import TaskDetailModal from './components/TaskDetailModal'
import TaskCreateModal from './components/TaskCreateModal'
import { can } from '../../stores/permissions'

const BACKEND_URL = (window as any).__ENV__?.BACKEND_URL || ''

interface Task { id: number; title: string; description?: string; status: string; priority: string; project_id: number; project_name?: string; due_date?: string; assignee_name?: string }

const columns = [
  { key: 'todo', label: '待办', color: '#64748b', bg: '#f1f5f9' },
  { key: 'in_progress', label: '进行中', color: '#d97706', bg: '#fffbeb' },
  { key: 'pending_review', label: '待验收', color: '#2563eb', bg: '#eff6ff' },
  { key: 'accepted', label: '验收通过', color: '#16a34a', bg: '#f0fdf4' },
]

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'gray' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'yellow' },
  urgent: { label: '紧急', color: 'red' },
}

const colStyle: React.CSSProperties = { flex: 1, minWidth: 280, borderRadius: 12, padding: 12, minHeight: 400 }
const taskCard: React.CSSProperties = { background: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'grab', border: '1px solid #e2e8f0', transition: 'box-shadow 0.15s' }

export default function TaskBoard() {
  const { user } = useOutletContext<{ user: any }>()
  const canAddTask = can(user?.role || '', 'task:create')
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [filterProject, setFilterProject] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchApi('/api/projects?limit=100').then(r => {
      if (r.success && r.data?.rows?.length) setProjects(r.data.rows)
    })
  }, [])

  const reload = () => {
    const url = filterProject ? `/api/tasks?project_id=${filterProject}` : '/api/tasks'
    fetchApi(url).then(r => { if (r.success) setAllTasks(r.data || []) })
  }

  useEffect(() => { reload() }, [filterProject])

  const filtered = allTasks.filter(t => {
    if (searchText) {
      const s = searchText.toLowerCase()
      if (!(t.title || '').toLowerCase().includes(s) && !(t.assignee_name || '').toLowerCase().includes(s) && !(t.project_name || '').toLowerCase().includes(s)) return false
    }
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const handleMove = async (taskId: number, newStatus: string) => {
    setDragOverCol(null)
    const prev = allTasks
    setAllTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    const r = await taskApi.move(String(taskId), newStatus)
    if (!r.success) { setAllTasks(prev); toast(r.message || '移动失败', 'error') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>任务看板</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
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
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', color: filterProject ? '#0f172a' : '#94a3b8' }}>
            <option value="">全部项目</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', color: filterPriority ? '#0f172a' : '#94a3b8' }}>
            <option value="">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          {canAddTask && (
            <button onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <Plus size={14} /> 新建任务
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {columns.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key)
          const isOver = dragOverCol === col.key
          return (
            <div key={col.key} style={{ ...colStyle, background: isOver ? col.bg : '#f8fafc', border: isOver ? `2px dashed ${col.color}` : '2px solid transparent' }}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.key) }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => { const tid = e.dataTransfer.getData('taskId'); if (tid) handleMove(Number(tid), col.key) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{col.label}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', background: '#e2e8f0', borderRadius: 10, padding: '1px 8px', marginLeft: 'auto' }}>{colTasks.length}</span>
              </div>
              {colTasks.map(task => {
                const pr = priorityMap[task.priority] || priorityMap.medium
                return (
                  <div key={task.id} style={{ ...taskCard, cursor: 'grab' }} draggable
                    onClick={() => setSelectedTask(task)}
                    onDragStart={e => e.dataTransfer.setData('taskId', String(task.id))}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: 6 }}>
                      <GripVertical size={14} color="#cbd5e1" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>{task.title}</div>
                        {task.project_name && !filterProject && (
                          <div style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', borderRadius: 4, padding: '1px 6px', display: 'inline-block', marginBottom: 4 }}>{task.project_name}</div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Badge color={pr.color}>{pr.label}</Badge>
                          {task.due_date && <span style={{ fontSize: 11, color: '#94a3b8' }}>截止 {task.due_date.slice(0, 10)}</span>}
                          {task.assignee_name && <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />{task.assignee_name}</span>}
                          {(task as any).attachments?.length > 0 && <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 2 }}><Paperclip size={10} />{(task as any).attachments.length}</span>}
                        </div>
                        {(task as any).attachments?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {(task as any).attachments.map((a: any) => (
                              <a key={a.id} href={`${BACKEND_URL}/uploads/${a.filename}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 10, color: '#334155', textDecoration: 'none' }}>
                                <Paperclip size={9} color="#64748b" /> {a.original_name} <Download size={9} color="#2563eb" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {colTasks.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#cbd5e1', fontSize: 13 }}>拖拽任务到此列</div>}
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
    </div>
  )
}
