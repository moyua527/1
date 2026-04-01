import { User, Shield, Edit2 } from 'lucide-react'
import Button from '../../ui/Button'
import Avatar from '../../ui/Avatar'
import Badge from '../../ui/Badge'
import Drawer from '../../ui/Drawer'
import InfoGrid from '../../ui/InfoGrid'
import SectionCard from '../../ui/SectionCard'

const roleMap: Record<string, { label: string; color: string; icon: any }> = {
  admin: { label: '管理员', color: 'red', icon: Shield },
  member: { label: '成员', color: 'blue', icon: User },
}

const statusMap: Record<number, { label: string; color: string }> = {
  1: { label: '启用', color: 'green' },
  0: { label: '待审批', color: 'yellow' },
  2: { label: '禁用', color: 'gray' },
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
  if (!detailUser) return null

  const r = roleMap[detailUser.role] || roleMap.member
  const st = getStatusInfo(detailUser)
  const genderLabel = detailUser.gender === 1 ? '男' : detailUser.gender === 2 ? '女' : '未设置'

  return (
    <Drawer open={open} onClose={onClose} title="用户详情">
      {/* Profile card */}
      <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border-secondary)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Avatar name={detailUser.nickname || detailUser.username} size={64} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 2 }}>
          {detailUser.nickname || detailUser.username}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 10 }}>@{detailUser.username}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Badge color={r.color}>{r.label}</Badge>
          <Badge color={st.color}>{st.label}</Badge>
        </div>
      </div>

      {/* Info sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="基础信息" padding={16}>
          <InfoGrid items={[
            { label: '用户ID', value: detailUser.display_id || `#${detailUser.id}` },
            { label: '用户名', value: `@${detailUser.username}` },
            { label: '手机号', value: detailUser.phone || '未绑定' },
            { label: '邮箱', value: detailUser.email || '未绑定' },
            { label: '性别', value: genderLabel },
            { label: '地区码', value: detailUser.area_code || '未设置' },
          ]} />
        </SectionCard>

        <SectionCard title="权限信息" padding={16}>
          <InfoGrid items={[
            { label: '上级', value: detailUser.manager_name || '无' },
            { label: '邀请码', value: detailUser.personal_invite_code || '无' },
          ]} />
        </SectionCard>

        <SectionCard title="操作记录" padding={16}>
          <InfoGrid items={[
            { label: '注册时间', value: fmtDate(detailUser.created_at) },
            { label: '最近登录', value: fmtDate(detailUser.last_login_at) },
            { label: '最后修改', value: fmtDate(detailUser.updated_at) },
          ]} columns={1} />
        </SectionCard>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
        <Button variant="secondary" size="sm" onClick={onClose}>关闭</Button>
        <Button size="sm" onClick={() => { onClose(); onEdit(detailUser) }}><Edit2 size={14} /> 编辑</Button>
      </div>
    </Drawer>
  )
}
