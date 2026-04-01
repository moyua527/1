export const PERMISSION_OPTIONS = [
  { value: 'clients:read', label: '读取客户', desc: '查询客户列表和详情' },
  { value: 'clients:write', label: '写入客户', desc: '创建/更新客户数据' },
  { value: 'projects:read', label: '读取项目', desc: '查询项目列表和详情' },
  { value: 'projects:write', label: '写入项目', desc: '创建/更新项目数据' },
  { value: 'webhook', label: 'Webhook', desc: '接收合作方推送事件' },
]

export interface Partner {
  id: number; partner_name: string; api_key: string; partner_url: string | null; partner_key?: string
  permissions: string[]; is_active: number; last_used_at: string | null; call_count: number
  created_at: string; notes: string | null
}

export const card: React.CSSProperties = { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }
