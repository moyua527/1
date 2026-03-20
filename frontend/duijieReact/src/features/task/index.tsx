import { useState, useEffect } from 'react'
import { fetchApi } from '../../bootstrap'
import { taskApi } from './services/api'
import Badge from '../ui/Badge'
import { toast } from '../ui/Toast'

interface Task { id: number; title: string; status: string; priority: string; project_id: number; due_date?: string }

const columns = [
  { key: 'todo', label: '待办', color: '#64748b' },
  { key: 'in_progress', label: '进行中', color: '#d97706' },
  { key: 'done', label: '已完成', color: '#16a34a' },
]

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'gray' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'yellow' },
  urgent: { label: '紧急', color: 'red' },
}

const colStyle: React.CSSProperties = { flex: 1, minWidth: 260, background: '#f8fafc', borderRadius: 12, padding: 12 }
const taskCard: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'grab' }

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')

  useEffect(() => {
    fetchApi('/api/projects?limit=100').then(r => {
      if (r.success && r.data?.rows?.length) {
        setProjects(r.data.rows)
        setSelectedProject(String(r.data.rows[0].id))
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    taskApi.list(selectedProject).then(r => { if (r.success) setTasks(r.data || []) })
  }, [selectedProject])

  const handleMove = async (taskId: number, newStatus: string) => {
    const r = await taskApi.move(String(taskId), newStatus)
    if (r.success) { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)); toast('任务状态已更新', 'success') }
    else toast(r.message || '移动失败', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
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
            return (
              <div key={col.key} style={colStyle}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { const tid = e.dataTransfer.getData('taskId'); if (tid) handleMove(Number(tid), col.key) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{col.label}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{colTasks.length}</span>
                </div>
                {colTasks.map(task => {
                  const pr = priorityMap[task.priority] || priorityMap.medium
                  return (
                    <div key={task.id} style={taskCard} draggable
                      onDragStart={e => e.dataTransfer.setData('taskId', String(task.id))}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 6 }}>{task.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Badge color={pr.color}>{pr.label}</Badge>
                        {task.due_date && <span style={{ fontSize: 11, color: '#94a3b8' }}>{task.due_date}</span>}
                      </div>
                    </div>
                  )
                })}
                {colTasks.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#cbd5e1', fontSize: 13 }}>空</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
