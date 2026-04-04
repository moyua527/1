import { useState, useRef } from 'react'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import { toast } from '../../ui/Toast'
import { projectApi } from '../services/api'

interface Props {
  open: boolean
  projectId: string
  onClose: () => void
}

export default function InviteMemberModal({ open, projectId, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [invitingId, setInvitingId] = useState<number | null>(null)
  const timerRef = useRef<any>(null)

  const handleSearch = (q: string) => {
    setSearch(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); setSearching(false); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      const r = await projectApi.searchUsersForInvite(projectId, q.trim())
      setSearching(false)
      if (r.success) setResults(r.data || [])
    }, 400)
  }

  const handleInvite = async (userId: number) => {
    setInvitingId(userId)
    const r = await projectApi.inviteMember(projectId, { user_id: userId })
    setInvitingId(null)
    if (r.success) {
      toast('邀请已发送，等待项目管理审批', 'success')
      setResults(prev => prev.filter(u => u.id !== userId))
    } else toast(r.message || '邀请失败', 'error')
  }

  const handleClose = () => {
    setSearch('')
    setResults([])
    setSearching(false)
    setInvitingId(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="邀请成员加入项目">
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>通过ID、昵称或手机号搜索用户并邀请，需项目管理审批后生效</div>
      <Input placeholder="输入用户ID、昵称或手机号搜索" value={search} onChange={e => handleSearch(e.target.value)} />
      <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 12 }}>
        {searching && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>搜索中...</div>}
        {!searching && results.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-secondary)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>{u.nickname || '用户'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID: {u.display_id || u.id}{u.phone ? ` · ${u.phone}` : ''}</div>
            </div>
            <button onClick={() => handleInvite(u.id)} disabled={invitingId === u.id}
              style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 12, cursor: 'pointer', opacity: invitingId === u.id ? 0.6 : 1 }}>
              {invitingId === u.id ? '邀请中...' : '邀请'}
            </button>
          </div>
        ))}
        {!searching && search && results.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>未找到匹配用户</div>}
        {!searching && !search && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>请输入用户ID或昵称进行搜索</div>}
      </div>
    </Modal>
  )
}
