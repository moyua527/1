import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, User, Mail, Shield } from 'lucide-react'
import Modal from '../../ui/Modal'
import Avatar from '../../ui/Avatar'
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
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['overview', 'tasks', 'milestones', 'files', 'messages'] as const
  type Tab = typeof validTabs[number]
  const urlTab = searchParams.get('tab') as Tab
  const tab: Tab = validTabs.includes(urlTab as any) ? urlTab! : 'overview'
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true })

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

      {tab === 'overview' && (<>
        <div style={section}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>进度</div>
            <ProgressBar value={project.progress || 0} />
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{project.progress || 0}%</div>
          </div>
          {project.description && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>描述</div><div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{project.description}</div></div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>开始日期</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.start_date || '未设置'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>结束日期</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.end_date || '未设置'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>预算</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.budget > 0 ? `¥${Number(project.budget).toLocaleString()}` : '未设置'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>客户</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.client_name || '-'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>创建时间</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.created_at ? new Date(project.created_at).toLocaleDateString('zh-CN') : '-'}</div></div>
            <div><div style={{ fontSize: 13, color: '#64748b' }}>任务数</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{tasks.length}</div></div>
          </div>
        </div>
        {project.members && project.members.length > 0 && (
          <div style={section}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>项目成员</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {project.members.map((m: any) => (
                <div key={m.id} onClick={() => setSelectedMember(m)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}>
                  <Avatar name={m.nickname || m.username || '?'} size={32} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{m.nickname || m.username}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.member_role === 'owner' ? '负责人' : m.member_role === 'editor' ? '编辑者' : '查看者'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>)}

      {tab === 'tasks' && (
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>任务列表</h3>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault()
            const form = e.target as HTMLFormElement
            const title = (form.elements.namedItem('taskTitle') as HTMLInputElement).value.trim()
            if (!title) return
            const r = await taskApi.create({ project_id: Number(id), title, created_by: 1 })
            if (r.success) {
              taskApi.list(id!).then(r2 => { if (r2.success) setTasks(r2.data || []) })
              form.reset()
            }
          }} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input name="taskTitle" placeholder="输入任务标题，回车添加" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
            <Button type="submit" style={{ padding: '8px 16px' }}>添加</Button>
          </form>
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
                    <select value={t.status} onChange={async (e) => {
                      await taskApi.move(String(t.id), e.target.value)
                      taskApi.list(id!).then(r2 => { if (r2.success) setTasks(r2.data || []) })
                    }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                      <option value="todo">待办</option>
                      <option value="in_progress">进行中</option>
                      <option value="done">已完成</option>
                    </select>
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

      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="成员信息">
        {selectedMember && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
            <Avatar name={selectedMember.nickname || selectedMember.username || '?'} size={64} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{selectedMember.nickname || selectedMember.username}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>@{selectedMember.username}</div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={16} color="#64748b" />
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>用户名</span>
                <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{selectedMember.username}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="#64748b" />
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>项目角色</span>
                <Badge color={selectedMember.member_role === 'owner' ? 'blue' : selectedMember.member_role === 'editor' ? 'green' : 'gray'}>
                  {selectedMember.member_role === 'owner' ? '负责人' : selectedMember.member_role === 'editor' ? '编辑者' : '查看者'}
                </Badge>
              </div>
              {selectedMember.nickname && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color="#64748b" />
                  <span style={{ fontSize: 13, color: '#64748b', minWidth: 70 }}>昵称</span>
                  <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{selectedMember.nickname}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
