export const sectionStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
export const infoRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 14, color: '#334155' }

export const channels = ['Boss直聘', '微信', '抖音', '小红书', '淘宝', '拼多多', '线下推荐', '其他']
export const positionLevels = ['C级高管', '副总裁/VP', '总监', '经理', '主管', '专员', '其他']
export const departmentOptions = ['总经办', '销售部', '市场部', '技术部', '产品部', '运营部', '人力资源', '财务部', '采购部', '客服部', '其他']
export const jobFunctions = ['决策者', '影响者', '使用者', '采购者', '技术评估', '项目管理', '其他']

export const fieldLabel: Record<string, string> = { channel: '渠道', name: '名称', company: '公司', email: '邮箱', phone: '电话', stage: '阶段', notes: '备注', position_level: '职位级别', department: '部门', job_function: '工作职能' }

export const followTypeMap: Record<string, { label: string; icon: string }> = {
  phone: { label: '电话', icon: 'phone' },
  wechat: { label: '微信', icon: 'message' },
  visit: { label: '拜访', icon: 'map' },
  email: { label: '邮件', icon: 'mail' },
  other: { label: '其他', icon: 'help' },
}

export const stageMap: Record<string, { label: string; color: string; bg: string }> = {
  potential: { label: '潜在', color: '#6b7280', bg: '#f3f4f6' },
  intent: { label: '意向', color: '#2563eb', bg: '#eff6ff' },
  signed: { label: '签约', color: '#7c3aed', bg: '#f5f3ff' },
  active: { label: '合作中', color: '#16a34a', bg: '#f0fdf4' },
  lost: { label: '流失', color: '#dc2626', bg: '#fef2f2' },
}

export const contractStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#6b7280', bg: '#f3f4f6' },
  active: { label: '生效中', color: '#16a34a', bg: '#f0fdf4' },
  expired: { label: '已到期', color: '#d97706', bg: '#fef3c7' },
  terminated: { label: '已终止', color: '#dc2626', bg: '#fef2f2' },
}
