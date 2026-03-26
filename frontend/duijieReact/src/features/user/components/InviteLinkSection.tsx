import { useState, useEffect } from 'react'
import { Link2, Copy, Trash2, User } from 'lucide-react'
import { fetchApi } from '../../../bootstrap'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import { toast } from '../../ui/Toast'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  member: { label: '成员', color: '#2563eb', bg: '#eff6ff', icon: User },
}

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

  useEffect(() => { loadLinks() }, [])

  return (
    <Modal open={open} onClose={onClose} title="邀请链接管理">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>生成新邀请链接</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#64748b' }}>平台身份</label>
              <div style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', color: '#0f172a' }}>成员</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#64748b' }}>有效期</label>
              <select value={inviteForm.expires_hours} onChange={e => setInviteForm({ ...inviteForm, expires_hours: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                <option value="24">24小时</option>
                <option value="72">3天</option>
                <option value="168">7天</option>
                <option value="720">30天</option>
                <option value="">永久</option>
              </select>
            </div>
          </div>
          <Input label="备注" placeholder="可选" value={inviteForm.note} onChange={e => setInviteForm({ ...inviteForm, note: e.target.value })} />
          <Button onClick={async () => {
            const r2 = await fetchApi('/api/invite-links', { method: 'POST', body: JSON.stringify({ expires_hours: inviteForm.expires_hours ? Number(inviteForm.expires_hours) : null, note: inviteForm.note }) })
            if (r2.success) {
              const url = `${window.location.origin}/?invite=${r2.data.token}`
              navigator.clipboard.writeText(url).then(() => toast('链接已复制到剪贴板', 'success')).catch(() => toast('生成成功，请手动复制', 'success'))
              loadLinks()
            } else toast(r2.message || '生成失败', 'error')
          }}><Link2 size={14} /> 生成并复制链接</Button>
        </div>
        {inviteLinks.length > 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>已生成的链接 ({inviteLinks.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {inviteLinks.map((link: any) => {
                const used = !!link.used_by
                const expired = link.expires_at && new Date(link.expires_at) < new Date()
                const status = used ? '已使用' : expired ? '已过期' : '可用'
                const statusColor = used ? '#16a34a' : expired ? '#dc2626' : '#2563eb'
                return (
                  <div key={link.id} style={{ padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: statusColor, fontWeight: 600, fontSize: 11, padding: '1px 6px', borderRadius: 4, background: used ? '#f0fdf4' : expired ? '#fef2f2' : '#eff6ff' }}>{status}</span>
                        <span style={{ color: '#64748b' }}>平台身份: {roleMap[link.preset_role]?.label || '成员'}</span>
                        {link.note && <span style={{ color: '#94a3b8' }}>· {link.note}</span>}
                      </div>
                      {used && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>使用者: {link.used_by_name || link.used_by_username}</div>}
                    </div>
                    {!used && !expired && (
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?invite=${link.token}`); toast('已复制', 'success') }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}><Copy size={14} /></button>
                    )}
                    <button onClick={async () => { const r2 = await fetchApi(`/api/invite-links/${link.id}`, { method: 'DELETE' }); if (r2.success) { toast('已删除', 'success'); loadLinks() } }} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#dc2626', display: 'flex' }}><Trash2 size={14} /></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
