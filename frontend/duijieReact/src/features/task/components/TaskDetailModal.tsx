import { useState } from 'react'
import { BACKEND_URL } from '../../../bootstrap'
import Modal from '../../ui/Modal'
import Badge from '../../ui/Badge'
import { Paperclip, Download, Calendar, Flag, AlignLeft, BellRing } from 'lucide-react'
import { formatDateTime } from '../../../utils/datetime'
import ImageViewer from '../../ui/ImageViewer'
import { taskApi } from '../services/api'
import { toast } from '../../ui/Toast'

const fmtSize = (b: number) => b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'gray' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'yellow' },
  urgent: { label: '紧急', color: 'red' },
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: '已提出', color: 'var(--brand)', bg: 'var(--bg-selected)' },
  disputed: { label: '待补充', color: 'var(--color-warning)', bg: '#fffbeb' },
  in_progress: { label: '执行中', color: '#7c3aed', bg: '#f5f3ff' },
  pending_review: { label: '待验收', color: '#ea580c', bg: '#fff7ed' },
  review_failed: { label: '验收不通过', color: 'var(--color-danger)', bg: '#fef2f2' },
  accepted: { label: '验收通过', color: 'var(--color-success)', bg: '#f0fdf4' },
}

const lbl: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }
const valStyle: React.CSSProperties = { fontSize: 14, color: 'var(--text-heading)', lineHeight: 1.6 }

const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name)

interface Props {
  task: any
  projectId: string
  open: boolean
  onClose: () => void
  onUpdated?: () => void
}

export default function TaskDetailModal({ task, open, onClose }: Props) {
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [previewStartIdx, setPreviewStartIdx] = useState(0)
  const [reminding, setReminding] = useState(false)
  if (!task) return null

  const handleRemind = async () => {
    setReminding(true)
    try {
      const r = await taskApi.remind(String(task.id))
      if (r.success) toast('催办已发送', 'success')
      else toast(r.message || '催办失败', 'error')
    } catch { toast('催办失败', 'error') }
    finally { setReminding(false) }
  }

  const st = statusMap[task.status] || statusMap.submitted
  const pr = priorityMap[task.priority] || priorityMap.medium
  const attachments = task.attachments || []
  const imgs = attachments.filter((a: any) => isImageFile(a.original_name || a.filename))
  const files = attachments.filter((a: any) => !isImageFile(a.original_name || a.filename))

  return (
    <>
    <Modal open={open} onClose={onClose} title="需求详情">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 标题 */}
        <div>
          <div style={lbl}><AlignLeft size={14} /> 标题</div>
          <div style={{ ...valStyle, fontWeight: 600, fontSize: 16 }}>{task.title}</div>
        </div>

        {/* 描述 */}
        {task.description && (
          <div>
            <div style={lbl}><AlignLeft size={14} /> 描述</div>
            <div style={{ ...valStyle, whiteSpace: 'pre-wrap', color: 'var(--text-body)' }}>{task.description}</div>
          </div>
        )}

        {/* 状态 + 优先级 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={lbl}><Flag size={14} /> 状态</div>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: st.bg, color: st.color, fontWeight: 600, border: `1px solid ${st.color}30` }}>{st.label}</span>
          </div>
          <div>
            <div style={lbl}><Flag size={14} /> 优先级</div>
            <Badge color={pr.color}>{pr.label}</Badge>
          </div>
        </div>

        {/* 截止日期 */}
        {task.due_date && (
          <div>
            <div style={lbl}><Calendar size={14} /> 截止日期</div>
            <div style={valStyle}>{task.due_date.slice(0, 10)}</div>
          </div>
        )}

        {/* 图片附件 */}
        {imgs.length > 0 && (
          <div>
            <div style={{ ...lbl, marginBottom: 8 }}><Paperclip size={14} /> 图片 ({imgs.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {imgs.map((a: any, i: number) => (
                <img key={a.id} src={`${BACKEND_URL}/uploads/${a.filename}`} alt=""
                  onClick={() => { setPreviewImg(`${BACKEND_URL}/uploads/${a.filename}`); setPreviewStartIdx(i) }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-primary)', display: 'block', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        )}

        {/* 文件附件 */}
        {files.length > 0 && (
          <div>
            <div style={{ ...lbl, marginBottom: 8 }}><Paperclip size={14} /> 附件 ({files.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                  <Paperclip size={12} color="var(--text-secondary)" />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-body)' }}>{a.original_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{fmtSize(a.file_size || 0)}</span>
                  <a href={`${BACKEND_URL}/uploads/${a.filename}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', padding: 4, borderRadius: 4, color: 'var(--brand)' }} title="下载">
                    <Download size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 创建信息 */}
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {task.creator_name && <span>创建人: {task.creator_name}</span>}
          {task.created_at && <span>创建时间: {formatDateTime(task.created_at)}</span>}
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-secondary)' }}>
          {task.assignee_id && task.status !== 'accepted' && (
            <button onClick={handleRemind} disabled={reminding}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-warning-bg, #fffbeb)', color: 'var(--color-warning, #d97706)', fontSize: 13, cursor: reminding ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: reminding ? 0.6 : 1 }}>
              <BellRing size={14} /> {reminding ? '发送中...' : '催办'}
            </button>
          )}
          <button onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 13, cursor: 'pointer' }}>
            关闭
          </button>
        </div>
      </div>
    </Modal>

      {previewImg && <ImageViewer src={previewImg} onClose={() => setPreviewImg(null)}
        images={imgs.length > 1 ? imgs.map((a: any) => `${BACKEND_URL}/uploads/${a.filename}`) : undefined}
        startIndex={previewStartIdx} />}
    </>
  )
}
