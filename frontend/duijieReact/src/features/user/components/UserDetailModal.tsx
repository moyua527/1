import { User, Shield, Clock, Edit2 } from 'lucide-react'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Avatar from '../../ui/Avatar'

const roleMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin: { label: '管理员', color: '#dc2626', bg: '#fef2f2', icon: Shield },
  member: { label: '成员', color: '#2563eb', bg: '#eff6ff', icon: User },
}

const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: '启用', color: '#16a34a', bg: '#f0fdf4' },
  0: { label: '待审批', color: '#d97706', bg: '#fffbeb' },
  2: { label: '禁用', color: '#94a3b8', bg: '#f1f5f9' },
}

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

const getStatusInfo = (u: any) => {
  if (u.is_active === 0) return statusMap[0]
  if (u.is_active === 2) return statusMap[2]
  return statusMap[1]
}

interface UserDetailModalProps {
  detailUser: any
  open: boolean
  onClose: () => void
  onEdit: (user: any) => void
}

export default function UserDetailModal({ detailUser, open, onClose, onEdit }: UserDetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="账号详情">
      {detailUser && (() => {
        const r = roleMap[detailUser.role] || roleMap.member
        const RIcon = r.icon
        const st = getStatusInfo(detailUser)
        const genderLabel = detailUser.gender === 1 ? '男' : detailUser.gender === 2 ? '女' : '未设置'
        const sections = [
          { title: '基础信息', icon: User, items: [
            { label: '用户ID', value: detailUser.display_id || `#${detailUser.id}` },
            { label: '用户名', value: `@${detailUser.username}` },
            { label: '昵称', value: detailUser.nickname || '未设置' },
            { label: '性别', value: genderLabel },
            { label: '手机号', value: detailUser.phone || '未绑定' },
            { label: '邮箱', value: detailUser.email || '未绑定' },
          ]},
          { title: '权限信息', icon: Shield, items: [
            { label: '角色', value: r.label, color: r.color },
            { label: '状态', value: st.label, color: st.color },
            { label: '上级', value: detailUser.manager_name || '无' },
            { label: '邀请码', value: detailUser.personal_invite_code || '无' },
          ]},
          { title: '操作记录', icon: Clock, items: [
            { label: '注册时间', value: fmtDate(detailUser.created_at) },
            { label: '最近登录', value: fmtDate(detailUser.last_login_at) },
            { label: '最后修改', value: fmtDate(detailUser.updated_at) },
            { label: '地区码', value: detailUser.area_code || '未设置' },
          ]},
        ]
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
              <Avatar name={detailUser.nickname || detailUser.username} size={56} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{detailUser.nickname || detailUser.username}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>@{detailUser.username}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: r.bg, color: r.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><RIcon size={12} /> {r.label}</span>
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
                </div>
              </div>
            </div>
            {sections.map(sec => (
              <div key={sec.title} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <sec.icon size={14} color="#64748b" /> {sec.title}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {sec.items.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #fafafa' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 56 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: (item as any).color || '#0f172a', fontWeight: 500, wordBreak: 'break-all' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={onClose}>关闭</Button>
              <Button onClick={() => { onClose(); onEdit(detailUser) }}><Edit2 size={14} /> 编辑</Button>
            </div>
          </div>
        )
      })()}
    </Modal>
  )
}
