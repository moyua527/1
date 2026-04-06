import { useState, useEffect } from 'react'
import { fetchApi } from '../bootstrap'

export interface ProjectPerms {
  projectRole: string
  source: string
  enterpriseRoleId: number | null
  can_create_project: boolean
  // 项目信息管理
  can_edit_project_name: boolean
  can_edit_project_desc: boolean
  can_edit_project_status: boolean
  can_delete_project: boolean
  // 关联客户企业
  can_send_client_request: boolean
  can_cancel_client_link: boolean
  can_change_client_link: boolean
  // 我方成员管理
  can_add_member: boolean
  can_assign_member_legacy_role: boolean
  can_assign_member_ent_role: boolean
  can_assign_member_proj_role: boolean
  can_remove_member: boolean
  // 修改成员角色
  can_update_member_legacy_role: boolean
  can_update_member_ent_role: boolean
  can_update_member_proj_role: boolean
  // 客户方成员
  can_view_client_users: boolean
  can_add_client_member: boolean
  can_remove_client_member: boolean
  // 加入审批
  can_view_join_requests: boolean
  can_approve_join: boolean
  can_reject_join: boolean
  // 角色管理
  can_create_role: boolean
  can_edit_role_name: boolean
  can_edit_role_color: boolean
  can_edit_role_perms: boolean
  can_delete_role: boolean
  // 任务创建
  can_create_task: boolean
  can_create_task_with_attachment: boolean
  // 任务删除与恢复
  can_delete_task: boolean
  can_view_task_trash: boolean
  can_restore_task: boolean
  // 任务状态流转
  can_move_task_accept: boolean
  can_move_task_dispute: boolean
  can_move_task_supplement: boolean
  can_move_task_submit_review: boolean
  can_move_task_reject: boolean
  can_move_task_approve: boolean
  can_move_task_resubmit: boolean
  // 任务编辑
  can_edit_task_title: boolean
  can_edit_task_desc: boolean
  can_edit_task_priority: boolean
  can_edit_task_deadline: boolean
  can_assign_task: boolean
  // 任务附件
  can_upload_task_attachment: boolean
  can_delete_task_attachment: boolean
  // 审核要点
  can_add_review_point: boolean
  can_respond_review_point: boolean
  can_confirm_review_point: boolean
  // 任务预设标题
  can_view_title_options: boolean
  can_record_title_history: boolean
  can_delete_title_history: boolean
  can_edit_title_presets: boolean
  // 代办管理
  can_create_milestone: boolean
  can_edit_milestone: boolean
  can_delete_milestone: boolean
  can_toggle_milestone: boolean
  // 报表
  can_view_report: boolean
  can_export_data: boolean
  // 应用/集成
  can_manage_app_config: boolean
  can_manage_app_integration: boolean
}

/**
 * 获取当前用户在指定项目中的有效权限（第二身份）
 */
export default function useProjectPerms(projectId: number | string | undefined) {
  const [perms, setPerms] = useState<ProjectPerms | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { setLoading(false); return }
    setLoading(true)
    fetchApi(`/api/projects/${projectId}/my-perms`)
      .then(r => { if (r.success) setPerms(r.data) })
      .finally(() => setLoading(false))
  }, [projectId])

  const canInProject = (perm: keyof ProjectPerms): boolean => {
    if (!perms) return false
    return !!perms[perm]
  }

  return { perms, loading, canInProject }
}
