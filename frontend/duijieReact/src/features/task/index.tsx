import { useState, useEffect } from 'react'
import { fetchApi } from '../../bootstrap'
import { taskApi } from './services/api'
import Badge from '../ui/Badge'
import { toast } from '../ui/Toast'
import { Plus, GripVertical } from 'lucide-react'

interface Task { id: number; title: string; description?: string; status: string; priority: string; project_id: number; due_date?: string; assignee_name?: string }

const columns = [
  { key: 'todo', label: '待办', color: '#64748b', bg: '#f1f5f9' },
  { key: 'in_progress', label: '进行中', color: '#d97706', bg: '#fffbeb' },
  { key: 'done', label: '已完成', color: '#16a34a', bg: '#f0fdf4' },
]

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'gray' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'yellow' },
  urgent: { label: '紧急', color: 'red' },
}

const colStyle: React.CSSProperties = { flex: 1, minWidth: 280, borderRadius: 12, padding: 12, minHeight: 400 }
const taskCard: React.CSSProperties = { background: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'grab', border: '1px solid #e2e8f0', transition: 'box-shadow 0.15s' }

function AddTaskForm({ projectId, status, onAdded }: { projectId: string; status: string; onAdded: () => void }) {
  const [show, setShow] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const handleSubmit = async () => {
    if (!title.trim()) return
    const r = await taskApi.create({ project_id: Number(projectId), title: title.trim(), status, priority })
    if (r.success) { toast('任务已创建', 'success'); setTitle(''); setPriority('medium'); setShow(false); onAdded() }
    else toast(r.message || '创建失败', 'error')
  }

  if (!show) return (
    <button onClick={() => setShow(true)} style={{ width: '100%', padding: '8px 0', border: '1px dashed #cbd5e1', borderRadius: 8, background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Plus size={14} /> 添加任务
    </button>
  )

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #2563eb', boxShadow: '0 0 0 2px rgba(37,99,235,0.1)' }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="任务标题" autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setShow(false) }}
        style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }}>
          <option value="low">低优先级</option>
          <option value="medium">中优先级</option>
          <option value="high">高优先级</option>
          <option value="urgent">紧急</option>
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShow(false)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: 'pointer' }}>取消</button>
        <button onClick={handleSubmit} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, cursor: 'pointer' }}>确定</button>
      </div>
    </div>
  )
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  useEffect(() => {
    fetchApi('/api/projects?limit=100').then(r => {
      if (r.success && r.data?.rows?.length) {
        setProjects(r.data.rows)
        setSelectedProject(String(r.data.rows[0].id))
      }
    })
  }, [])

  const reload = () => { if (selectedProject) taskApi.list(selectedProject).then(r => { if (r.success) setTasks(r.data || []) }) }

  useEffect(() => { reload() }, [selectedProject])

  const handleMove = async (taskId: number, newStatus: string) => {
    setDragOverCol(null)
    const r = await taskApi.move(String(taskId), newStatus)
    if (r.success) { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)); toast('任务状态已更新', 'success') }
    else toast(r.message || '移动失败', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>任务看板</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>拖拽管理任务状态</p>
        </div>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!selectedProject ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>请先创建一个项目</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key)
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
                    <div key={task.id} style={taskCard} draggable
                      onDragStart={e => e.dataTransfer.setData('taskId', String(task.id))}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: 6 }}>
                        <GripVertical size={14} color="#cbd5e1" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 6 }}>{task.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Badge color={pr.color}>{pr.label}</Badge>
                            {task.due_date && <span style={{ fontSize: 11, color: '#94a3b8' }}>截止 {task.due_date}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {colTasks.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#cbd5e1', fontSize: 13 }}>拖拽任务到此列</div>}
                <div style={{ marginTop: 8 }}><AddTaskForm projectId={selectedProject} status={col.key} onAdded={reload} /></div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
