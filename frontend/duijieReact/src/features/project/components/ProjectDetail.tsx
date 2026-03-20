import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import { projectApi } from '../services/api'
import { taskApi } from '../../task/services/api'
import Button from '../../ui/Button'
import Badge from '../../ui/Badge'
import ProgressBar from '../../ui/ProgressBar'
import FileList from '../../file/components/FileList'
import MessagePanel from '../../message/components/MessagePanel'
import { confirm } from '../../ui/ConfirmDialog'
import MilestoneList from '../../milestone/components/MilestoneList'
import { toast } from '../../ui/Toast'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

const taskStatusMap: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: 'gray' },
  in_progress: { label: '进行中', color: 'yellow' },
  done: { label: '已完成', color: 'green' },
}

const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

export default function ProjectDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [tab, setTab] = useState<'overview' | 'tasks' | 'files' | 'milestones' | 'messages'>('overview')

  useEffect(() => {
    if (!id) return
    projectApi.detail(id).then(r => { if (r.success) setProject(r.data) })
    taskApi.list(id).then(r => { if (r.success) setTasks(r.data || []) })
  }, [id])

  if (!project) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>加载中...</div>

  const st = statusMap[project.status] || statusMap.planning

  const handleDelete = async () => {
    if (!(await confirm({ message: '确定删除此项目？', danger: true }))) return
    const r = await projectApi.remove(id!)
    if (r.success) { toast('项目已删除', 'success'); nav('/projects') }
    else toast(r.message || '删除失败', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => nav('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>{project.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Badge color={st.color}>{st.label}</Badge>
            {project.client_name && <span style={{ fontSize: 13, color: '#64748b' }}>客户: {project.client_name}</span>}
          </div>
        </div>
        <Button variant="danger" onClick={handleDelete}><Trash2 size={14} /> 删除</Button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['overview','概览'],['tasks','任务'],['milestones','里程碑'],['files','文件'],['messages','消息']] as const).map(([k,v]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: tab === k ? '#2563eb' : '#f1f5f9', color: tab === k ? '#fff' : '#64748b',
          }}>{v}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={section}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>进度</div>
            <ProgressBar value={project.progress || 0} />
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{project.progress || 0}%</div>
          </div>
          {project.description && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>描述</div><div style={{ fontSize: 14, color: '#334155' }}>{project.description}</div></div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {project.start_date && <div><div style={{ fontSize: 13, color: '#64748b' }}>开始日期</div><div style={{ fontSize: 14, fontWeight: 500 }}>{project.start_date}</div></div>}
            {project.end_date && <div><div style={{ fontSize: 13, color: '#64748b' }}>结束日期</div><div style={{ fontSize: 14, fontWeight: 500 }}>{project.end_date}</div></div>}
            {project.budget > 0 && <div><div style={{ fontSize: 13, color: '#64748b' }}>预算</div><div style={{ fontSize: 14, fontWeight: 500 }}>¥{Number(project.budget).toLocaleString()}</div></div>}
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div style={section}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>任务列表</h3>
          {tasks.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无任务</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map((t: any) => {
                const ts = taskStatusMap[t.status] || taskStatusMap.todo
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{t.title}</div>
                      {t.due_date && <div style={{ fontSize: 12, color: '#94a3b8' }}>截止: {t.due_date}</div>}
                    </div>
                    <Badge color={ts.color}>{ts.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'milestones' && <div style={section}><MilestoneList projectId={id!} /></div>}
      {tab === 'files' && <div style={section}><FileList projectId={id!} /></div>}
      {tab === 'messages' && <div style={section}><MessagePanel projectId={id!} /></div>}
    </div>
  )
}
