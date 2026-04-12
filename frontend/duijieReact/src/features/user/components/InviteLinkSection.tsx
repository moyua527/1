import { useState, useEffect } from 'react'
import { Link2, Copy, Trash2 } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Badge from '../../ui/Badge'
import SectionCard from '../../ui/SectionCard'
import { FormGrid } from '../../ui/Form'
import { toast } from '../../ui/Toast'

const expiresOptions = [
  { value: '24', label: '24小时' },
  { value: '72', label: '3天' },
  { value: '168', label: '7天' },
  { value: '720', label: '30天' },
  { value: '', label: '永久' },
]

interface InviteLinkSectionProps {
  open: boolean
  onClose: () => void
}

export default function InviteLinkSection({ open, onClose }: InviteLinkSectionProps) {
  const [inviteLinks, setInviteLinks] = useState<any[]>([])
  const [inviteForm, setInviteForm] = useState({ expires_hours: '72', note: '' })

  const loadLinks = async () => {
    const r = await fetchApi('/api/invite-links')
    if (r.success) setInviteLinks(r.data || [])
  }

  useEffect(() => { if (open) loadLinks() }, [open])

  return (
    <Modal open={open} onClose={onClose} title="邀请链接管理">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="生成新邀请链接" padding={16}>
          <FormGrid>
            <Input label="平台身份" value="成员" disabled />
            <Select label="有效期" value={inviteForm.expires_hours} onChange={v => setInviteForm({ ...inviteForm, expires_hours: v })} options={expiresOptions} />
          </FormGrid>
          <div style={{ marginTop: 12 }}>
            <Input label="备注" placeholder="可选" value={inviteForm.note} onChange={e => setInviteForm({ ...inviteForm, note: e.target.value })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Button onClick={async () => {
              const r2 = await fetchApi('/api/invite-links', { method: 'POST', body: JSON.stringify({ expires_hours: inviteForm.expires_hours ? Number(inviteForm.expires_hours) : null, note: inviteForm.note }) })
              if (r2.success) {
                const url = `${window.location.origin}/invite/${r2.data.token}`
                navigator.clipboard.writeText(url).then(() => toast('链接已复制到剪贴板', 'success')).catch(() => toast('生成成功，请手动复制', 'success'))
                loadLinks()
              } else toast(r2.message || '生成失败', 'error')
            }}><Link2 size={14} /> 生成并复制链接</Button>
          </div>
        </SectionCard>

        {inviteLinks.length > 0 && (
          <SectionCard title={`已生成的链接 (${inviteLinks.length})`} padding={0}>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 300, overflowY: 'auto' }}>
              {inviteLinks.map((link: any) => {
                const used = !!link.used_by
                const expired = link.expires_at && new Date(link.expires_at) < new Date()
                const badgeColor = used ? 'green' : expired ? 'red' : 'blue'
                const status = used ? '已使用' : expired ? '已过期' : '可用'
                return (
                  <div key={link.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Badge color={badgeColor}>{status}</Badge>
                        <span style={{ color: 'var(--text-secondary)' }}>成员</span>
                        {link.note && <span style={{ color: 'var(--text-tertiary)' }}>· {link.note}</span>}
                      </div>
                      {used && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>使用者: {link.used_by_name || link.used_by_username}</div>}
                    </div>
                    {!used && !expired && (
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${link.token}`).then(() => toast('已复制', 'success')).catch(() => toast('复制失败', 'error')) }}><Copy size={14} /></Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={async () => { const r2 = await fetchApi(`/api/invite-links/${link.id}`, { method: 'DELETE' }); if (r2.success) { toast('已删除', 'success'); loadLinks() } }} style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></Button>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        )}
      </div>
    </Modal>
  )
}
