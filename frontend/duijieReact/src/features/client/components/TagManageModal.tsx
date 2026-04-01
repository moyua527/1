import { useState, useEffect } from 'react'
import { clientApi } from '../services/api'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'

interface TagManageModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  clientTags: any[]
  onSaved: () => void
}

export default function TagManageModal({ open, onClose, clientId, clientTags, onSaved }: TagManageModalProps) {
  const [allTags, setAllTags] = useState<any[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6b7280')

  useEffect(() => {
    if (!open) return
    clientApi.allTags().then(r => { if (r.success) setAllTags(r.data || []) })
    setSelectedTagIds(clientTags.map((t: any) => t.id))
  }, [open, clientTags])

  const toggleTag = (tid: number) => {
    setSelectedTagIds(prev => prev.includes(tid) ? prev.filter(i => i !== tid) : [...prev, tid])
  }

  const handleSaveTags = async () => {
    const r = await clientApi.setClientTags(clientId, selectedTagIds)
    if (r.success) { toast('标签已更新', 'success'); onClose(); onSaved() }
    else toast(r.message || '保存失败', 'error')
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const r = await clientApi.createTag({ name: newTagName.trim(), color: newTagColor })
    if (r.success) {
      setNewTagName('')
      const r2 = await clientApi.allTags()
      if (r2.success) setAllTags(r2.data || [])
      setSelectedTagIds(prev => [...prev, r.data.id])
    } else toast(r.message || '创建失败', 'error')
  }

  return (
    <Modal open={open} onClose={onClose} title="管理标签">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新标签名称..."
            style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }} />
          <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)}
            style={{ width: 36, height: 32, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
          <button onClick={handleCreateTag}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: 'var(--bg-primary)', cursor: 'pointer', fontSize: 13 }}>创建</button>
        </div>
        {allTags.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 16 }}>暂无标签，请先创建</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allTags.map((t: any) => {
              const selected = selectedTagIds.includes(t.id)
              return (
                <button key={t.id} onClick={() => toggleTag(t.id)}
                  style={{ padding: '5px 12px', borderRadius: 16, border: selected ? `2px solid ${t.color}` : '2px solid var(--border-primary)', background: selected ? t.color + '18' : 'var(--bg-primary)', color: selected ? t.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: selected ? 600 : 400, transition: 'all 0.15s' }}>
                  {t.name}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={onClose}>取消</Button>
        <Button onClick={handleSaveTags}>保存</Button>
      </div>
    </Modal>
  )
}
