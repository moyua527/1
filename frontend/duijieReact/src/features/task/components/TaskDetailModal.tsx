import { useState, useEffect } from 'react'
import { BACKEND_URL } from '../../../bootstrap'
import Modal from '../../ui/Modal'
import Badge from '../../ui/Badge'
import { Paperclip, Download, Calendar, Flag, AlignLeft, BellRing, SlidersHorizontal } from 'lucide-react'
import { formatDateTime } from '../../../utils/datetime'
import ImageViewer from '../../ui/ImageViewer'
import { taskApi } from '../services/api'
import { projectApi } from '../../project/services/api'
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

export default function TaskDetailModal({ task, projectId, open, onClose }: Props) {
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [previewStartIdx, setPreviewStartIdx] = useState(0)
  const [reminding, setReminding] = useState(false)
  const [customValues, setCustomValues] = useState<any[]>([])
  const [customFields, setCustomFields] = useState<any[]>([])
  const [cfEditing, setCfEditing] = useState<Record<number, string>>({})
  const [, setCfSaving] = useState(false)

  useEffect(() => {
    if (open && task?.id && projectId) {
      projectApi.listCustomFields(projectId).then(r => { if (r.success) setCustomFields(r.data || []) })
      projectApi.getTaskCustomValues(String(task.id)).then(r => { if (r.success) setCustomValues(r.data || []) })
    }
    if (!open) { setCustomValues([]); setCustomFields([]); setCfEditing({}) }
  }, [open, task?.id, projectId])

  if (!task) return null

  const handleCfSave = async (fieldId: number, value: string) => {
    setCfSaving(true)
    const r = await projectApi.setTaskCustomValues(String(task.id), [{ field_id: fieldId, value: value || null }])
    setCfSaving(false)
    if (!r.success) toast('保存失败', 'error')
  }

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

        {/* 扩展属性 */}
        {customFields.length > 0 && (
          <div>
            <div style={lbl}><SlidersHorizontal size={14} /> 扩展属性</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customFields.map(f => {
                const existing = customValues.find(v => v.field_id === f.id)
                const curVal = cfEditing[f.id] !== undefined ? cfEditing[f.id] : (existing?.value || '')
                const isEditing = cfEditing[f.id] !== undefined
                const cfInput: React.CSSProperties = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: 'var(--bg-secondary)', color: 'var(--text-heading)' }
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 70, flexShrink: 0 }}>{f.name}:</span>
                    {f.field_type === 'select' ? (
                      <select value={curVal} onChange={e => { setCfEditing({ ...cfEditing, [f.id]: e.target.value }); handleCfSave(f.id, e.target.value) }} style={{ ...cfInput, cursor: 'pointer' }}>
                        <option value="">未选择</option>
                        {(f.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.field_type === 'multi_select' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                        {(f.options || []).map((o: string) => {
                          const selected = (curVal || '').split(',').includes(o)
                          return (
                            <button key={o} onClick={() => {
                              const arr = (curVal || '').split(',').filter(Boolean)
                              const next = selected ? arr.filter((x: string) => x !== o) : [...arr, o]
                              const val = next.join(',')
                              setCfEditing({ ...cfEditing, [f.id]: val })
                              handleCfSave(f.id, val)
                            }}
                              style={{ padding: '2px 8px', borderRadius: 12, border: `1px solid ${selected ? 'var(--brand)' : 'var(--border-primary)'}`, background: selected ? 'var(--bg-selected)' : 'var(--bg-secondary)', color: selected ? 'var(--brand)' : 'var(--text-body)', fontSize: 12, cursor: 'pointer' }}>
                              {o}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <input
                        type={f.field_type === 'date' ? 'date' : f.field_type === 'number' || f.field_type === 'amount' ? 'number' : 'text'}
                        value={curVal}
                        step={f.field_type === 'amount' ? '0.01' : undefined}
                        onChange={e => setCfEditing({ ...cfEditing, [f.id]: e.target.value })}
                        onBlur={() => { if (isEditing) handleCfSave(f.id, curVal) }}
                        placeholder={f.field_type === 'amount' ? '0.00' : ''}
                        style={cfInput}
                      />
                    )}
                  </div>
                )
              })}
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
