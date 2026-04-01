export interface Client {
  id: number
  name: string
  company: string | null
  client_type: 'company' | 'individual'
  stage: 'potential' | 'intent' | 'signed' | 'active' | 'lost'
  channel: string | null
  email: string | null
  phone: string | null
  position_level: string | null
  department: string | null
  job_function: string | null
  notes: string | null
  assigned_to: number | null
  assigned_name: string | null
  score: string | null
  user_id: number | null
  created_by: number | null
  created_at: string
  updated_at: string
  tags?: { id: number; name: string }[]
}

export interface Project {
  id: number
  name: string
  description: string | null
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'
  client_id: number | null
  client_name: string | null
  client_company?: string | null
  internal_client_id?: number | null
  internal_client_name?: string | null
  internal_client_company?: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  app_name: string | null
  app_url: string | null
  created_by: number | null
  created_at: string
  members?: ProjectMember[]
}

export interface ProjectMember {
  id: number
  user_id: number
  nickname: string
  username: string
  role: string
  avatar: string | null
}

export interface User {
  id: number
  username: string
  nickname: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  role: 'admin' | 'member'
  gender: number | null
  is_active: number
  manager_id: number | null
  client_id: number | null
  personal_invite_code: string | null
  display_id: string | null
  last_login_at: string | null
  created_at: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'pending_review' | 'accepted'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: number | null
  assigned_name: string | null
  due_date: string | null
  project_name: string | null
  attachment_count: number
  created_by: number | null
  created_at: string
}

export interface Ticket {
  id: number
  title: string
  content: string | null
  type: 'requirement' | 'bug' | 'question' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'processing' | 'resolved' | 'closed'
  project_id: number | null
  project_name: string | null
  assigned_to: number | null
  assignee_name: string | null
  created_by: number
  creator_name: string | null
  creator_username: string | null
  rating: number | null
  rating_comment: string | null
  reply_count: number
  created_at: string
  replies?: TicketReply[]
  attachments?: FileAttachment[]
}

export interface TicketReply {
  id: number
  ticket_id: number
  content: string
  created_by: number
  creator_name: string | null
  creator_username: string | null
  creator_role: string | null
  created_at: string
  attachments?: FileAttachment[]
}

export interface FileAttachment {
  id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string | null
}

export interface Opportunity {
  id: number
  title: string
  client_id: number | null
  client_name: string | null
  amount: number
  probability: number
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  expected_close: string | null
  assigned_to: number | null
  assigned_name: string | null
  notes: string | null
  created_by: number | null
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  content: string | null
  link: string | null
  is_read: number
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  total?: number
}
