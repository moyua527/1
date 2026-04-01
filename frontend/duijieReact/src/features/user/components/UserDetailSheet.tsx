import { useEffect } from 'react'
import { User, Shield, Clock, Edit2, X, Mail, Phone, Hash, MapPin, Calendar } from 'lucide-react'
import Button from '../../ui/Button'
import Avatar from '../../ui/Avatar'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: 'var(--color-danger)', bg: 'var(--bg-danger)', icon: Shield },
  member: { label: '成员', color: 'var(--brand)', bg: 'var(--brand-light)', icon: User },
}

const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: '启用', color: 'var(--color-success)', bg: 'var(--bg-success)' },
  0: { label: '待审批', color: 'var(--color-warning)', bg: 'var(--bg-warning)' },
  2: { label: '禁用', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
}

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

const getStatusInfo = (u: any) => {
  if (u.is_active === 0) return statusMap[0]
  if (u.is_active === 2) return statusMap[2]
  return statusMap[1]
}

interface Props {
  detailUser: any
  open: boolean
  onClose: () => void
  onEdit: (user: any) => void
}

export default function UserDetailSheet({ detailUser, open, onClose, onEdit }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open || !detailUser) return null

  const r = roleMap[detailUser.role] || roleMap.member
  const RIcon = r.icon
  const st = getStatusInfo(detailUser)
  const genderLabel = detailUser.gender === 1 ? '男' : detailUser.gender === 2 ? '女' : '未设置'

  const infoRows = [
    { icon: Hash, label: '用户ID', value: detailUser.display_id || `#${detailUser.id}` },
    { icon: User, label: '用户名', value: `@${detailUser.username}` },
    { icon: Phone, label: '手机号', value: detailUser.phone || '未绑定' },
    { icon: Mail, label: '邮箱', value: detailUser.email || '未绑定' },
    { icon: User, label: '性别', value: genderLabel },
    { icon: MapPin, label: '地区码', value: detailUser.area_code || '未设置' },
  ]

  const metaRows = [
    { icon: Calendar, label: '注册时间', value: fmtDate(detailUser.created_at) },
    { icon: Clock, label: '最近登录', value: fmtDate(detailUser.last_login_at) },
    { icon: Calendar, label: '最后修改', value: fmtDate(detailUser.updated_at) },
  ]

  return (
    <>
      {/* Overlay */}
      <div className="sheet-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="sheet-panel">
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>用户详情</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Profile card */}
        <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid var(--border-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Avatar name={detailUser.nickname || detailUser.username} size={64} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 2 }}>
            {detailUser.nickname || detailUser.username}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 10 }}>@{detailUser.username}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: r.bg, color: r.color, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RIcon size={11} /> {r.label}
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 600 }}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Info sections */}
        <div style={{ padding: '16px 20px' }}>
          {/* Basic info */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>基础信息</div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, overflow: 'hidden' }}>
              {infoRows.map((item, i) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: i < infoRows.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                  <item.icon size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8, minWidth: 56 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: 500, marginLeft: 'auto', textAlign: 'right', wordBreak: 'break-all' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Permission info */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>权限信息</div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border-secondary)' }}>
                <Shield size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8, minWidth: 56 }}>上级</span>
                <span style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: 500, marginLeft: 'auto' }}>{detailUser.manager_name || '无'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
                <Hash size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8, minWidth: 56 }}>邀请码</span>
                <span style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: 500, marginLeft: 'auto', fontFamily: 'monospace' }}>{detailUser.personal_invite_code || '无'}</span>
              </div>
            </div>
          </div>

          {/* Time info */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>操作记录</div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, overflow: 'hidden' }}>
              {metaRows.map((item, i) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: i < metaRows.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                  <item.icon size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8, minWidth: 56 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: 500, marginLeft: 'auto' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-primary)', position: 'sticky', bottom: 0, background: 'var(--bg-primary)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={onClose} style={{ fontSize: 13 }}>关闭</Button>
          <Button onClick={() => { onClose(); onEdit(detailUser) }} style={{ fontSize: 13 }}><Edit2 size={14} /> 编辑</Button>
        </div>
      </div>
    </>
  )
}
