import { useState, useEffect } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { fetchApi } from '../../../bootstrap'

interface Props {
  open: boolean
  hasExternalEnterprise: boolean
  onClose: () => void
  onSendRequest: (clientId: number) => Promise<boolean>
  onRemoveClient: () => Promise<boolean>
}

export default function SetClientModal({ open, hasExternalEnterprise, onClose, onSendRequest, onRemoveClient }: Props) {
  const [clients, setClients] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedId('')
      setLoading(false)
      fetchApi('/api/clients').then(r => {
        if (r.success) setClients((r.data || []).filter((c: any) => c.client_type === 'company'))
      })
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title={hasExternalEnterprise ? '更换客户企业' : '关联客户企业'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 6 }}>选择客户企业</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--text-disabled)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)' }}>
            <option value="">请选择企业</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
            ))}
          </select>
          {clients.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>暂无可关联的企业</div>}
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>发送关联请求后，需要对方企业管理员审批同意才可完成关联</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {hasExternalEnterprise && (
            <Button variant="secondary" disabled={loading} onClick={async () => {
              setLoading(true)
              const ok = await onRemoveClient()
              setLoading(false)
              if (ok) onClose()
            }}>取消关联</Button>
          )}
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button disabled={loading || !selectedId} onClick={async () => {
            if (!selectedId) { toast('请选择客户企业', 'error'); return }
            setLoading(true)
            const ok = await onSendRequest(Number(selectedId))
            setLoading(false)
            if (ok) onClose()
          }}>{loading ? '发送中...' : '发送关联请求'}</Button>
        </div>
      </div>
    </Modal>
  )
}
