import { useState, useEffect, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { PROJECT_ICONS, PROJECT_COLORS } from '../../../utils/projectIcons'
import { projectApi } from '../services/api'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

interface Props {
  open: boolean
  project: any
  onClose: () => void
  onSave: (data: { name: string; description: string; status: string; task_title_presets: string[]; icon: string; icon_color: string }) => Promise<boolean>
}

export default function EditProjectModal({ open, project, onClose, onSave }: Props) {
  const [form, setForm] = useState({ name: '', description: '', status: 'planning', task_title_presets: [] as string[], newPreset: '', icon: 'FolderKanban', icon_color: '#3b82f6' })
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        task_title_presets: Array.isArray(project.task_title_presets) ? [...project.task_title_presets] : [],
        newPreset: '',
        icon: project.icon || 'FolderKanban',
        icon_color: project.icon_color || '#3b82f6',
      })
      setCoverImage(project.cover_image || null)
    }
  }, [open, project])

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast('请选择图片文件', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { toast('图片不能超过 5MB', 'error'); return }
    setCoverUploading(true)
    const r = await projectApi.setCover(String(project.id), file)
    setCoverUploading(false)
    if (r.success) {
      setCoverImage(r.data.cover_image)
      toast('封面已更新', 'success')
    } else toast(r.message || '上传失败', 'error')
  }

  const handleRemoveCover = async () => {
    setCoverUploading(true)
    const r = await projectApi.removeCover(String(project.id))
    setCoverUploading(false)
    if (r.success) { setCoverImage(null); toast('封面已移除', 'success') }
    else toast(r.message || '移除失败', 'error')
  }

  const addPreset = () => {
    const v = form.newPreset.trim()
    if (v && !form.task_title_presets.includes(v)) setForm(f => ({ ...f, task_title_presets: [...f.task_title_presets, v], newPreset: '' }))
  }

  return (
    <Modal open={open} onClose={onClose} title="编辑项目">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>卡片封面</label>
          <input ref={coverInputRef} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = '' }} />
          {coverImage ? (
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 4 }}>
              <img src={coverImage} alt="cover" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <ImagePlus size={14} />
                </button>
                <button type="button" onClick={handleRemoveCover} disabled={coverUploading}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
              style={{ width: '100%', height: 80, borderRadius: 10, border: '2px dashed var(--border-primary)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 13, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}>
              <ImagePlus size={18} />
              {coverUploading ? '上传中...' : '点击上传封面图片'}
            </button>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>支持 JPG/PNG/WebP，最大 5MB，建议宽高比 16:9</div>
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>项目名称</label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="项目名称" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>卡片图标</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {PROJECT_ICONS.map(i => {
              const active = form.icon === i.key
              return (
                <button key={i.key} type="button" title={i.label} onClick={() => setForm(f => ({ ...f, icon: i.key }))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: active ? `2px solid ${form.icon_color}` : '1px solid var(--border-primary)', background: active ? form.icon_color + '18' : 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  <i.icon size={18} color={active ? form.icon_color : 'var(--text-tertiary)'} />
                </button>
              )
            })}
          </div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>图标颜色</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {PROJECT_COLORS.map(c => {
              const active = form.icon_color === c.key
              return (
                <button key={c.key} type="button" title={c.label} onClick={() => setForm(f => ({ ...f, icon_color: c.key }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: active ? '3px solid var(--text-heading)' : '2px solid transparent', background: c.key, cursor: 'pointer', transition: 'all 0.15s', boxShadow: active ? '0 0 0 2px var(--bg-primary)' : 'none' }} />
              )
            })}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>描述</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="项目描述（可选）" rows={3}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14, resize: 'vertical' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>固定功能名称</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={form.newPreset} onChange={e => setForm(f => ({ ...f, newPreset: e.target.value }))}
              placeholder="输入功能名称" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPreset() } }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14 }} />
            <Button variant="secondary" onClick={addPreset}>添加</Button>
          </div>
          {form.task_title_presets.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.task_title_presets.map((p, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-tertiary)', fontSize: 13, color: 'var(--text-body)' }}>
                  {p}
                  <button type="button" onClick={() => setForm(f => ({ ...f, task_title_presets: f.task_title_presets.filter((_, j) => j !== i) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>需求创建时可直接下拉选择这些固定功能名称</div>
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>状态</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14 }}>
            {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={async () => {
            if (!form.name.trim()) { toast('请输入项目名称', 'error'); return }
            const ok = await onSave({ name: form.name.trim(), description: form.description.trim(), status: form.status, task_title_presets: form.task_title_presets, icon: form.icon, icon_color: form.icon_color })
            if (ok) onClose()
          }}>保存</Button>
        </div>
      </div>
    </Modal>
  )
}
