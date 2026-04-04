-- 030_granular_60_project_permissions.sql
-- 将 project_roles 的 16 个权限字段拆分为 60 个细粒度操作级权限
-- enterprise_roles 保持 16 个字段不变，在代码层做映射展开

-- ========== 1. 添加 53 个新列 ==========

-- 项目信息管理（拆分自 can_edit_project）
ALTER TABLE project_roles ADD COLUMN can_edit_project_name TINYINT(1) DEFAULT 0 COMMENT '修改项目名称';
ALTER TABLE project_roles ADD COLUMN can_edit_project_desc TINYINT(1) DEFAULT 0 COMMENT '修改项目描述';
ALTER TABLE project_roles ADD COLUMN can_edit_project_status TINYINT(1) DEFAULT 0 COMMENT '修改项目状态';

-- 关联客户企业（拆分自 can_set_client）
ALTER TABLE project_roles ADD COLUMN can_send_client_request TINYINT(1) DEFAULT 0 COMMENT '发起关联客户企业请求';
ALTER TABLE project_roles ADD COLUMN can_cancel_client_link TINYINT(1) DEFAULT 0 COMMENT '取消客户企业关联';
ALTER TABLE project_roles ADD COLUMN can_change_client_link TINYINT(1) DEFAULT 0 COMMENT '变更客户企业';

-- 添加成员（can_add_member 保留，新增3个兄弟列）
ALTER TABLE project_roles ADD COLUMN can_assign_member_legacy_role TINYINT(1) DEFAULT 0 COMMENT '添加时指定遗留角色';
ALTER TABLE project_roles ADD COLUMN can_assign_member_ent_role TINYINT(1) DEFAULT 0 COMMENT '添加时分配企业角色';
ALTER TABLE project_roles ADD COLUMN can_assign_member_proj_role TINYINT(1) DEFAULT 0 COMMENT '添加时分配项目角色';

-- 修改成员角色（拆分自 can_update_member_role）
ALTER TABLE project_roles ADD COLUMN can_update_member_legacy_role TINYINT(1) DEFAULT 0 COMMENT '修改成员遗留角色';
ALTER TABLE project_roles ADD COLUMN can_update_member_ent_role TINYINT(1) DEFAULT 0 COMMENT '修改成员企业角色';
ALTER TABLE project_roles ADD COLUMN can_update_member_proj_role TINYINT(1) DEFAULT 0 COMMENT '修改成员项目角色';

-- 客户方成员（拆分自 can_manage_client_member）
ALTER TABLE project_roles ADD COLUMN can_view_client_users TINYINT(1) DEFAULT 0 COMMENT '查看客户企业可用用户';
ALTER TABLE project_roles ADD COLUMN can_add_client_member TINYINT(1) DEFAULT 0 COMMENT '添加客户方成员';
ALTER TABLE project_roles ADD COLUMN can_remove_client_member TINYINT(1) DEFAULT 0 COMMENT '移除客户方成员';

-- 加入审批（can_approve_join 保留，新增2个兄弟列）
ALTER TABLE project_roles ADD COLUMN can_view_join_requests TINYINT(1) DEFAULT 0 COMMENT '查看待审批列表';
ALTER TABLE project_roles ADD COLUMN can_reject_join TINYINT(1) DEFAULT 0 COMMENT '拒绝加入申请';

-- 角色管理（拆分自 can_manage_roles）
ALTER TABLE project_roles ADD COLUMN can_create_role TINYINT(1) DEFAULT 0 COMMENT '创建项目角色';
ALTER TABLE project_roles ADD COLUMN can_edit_role_name TINYINT(1) DEFAULT 0 COMMENT '编辑角色名称';
ALTER TABLE project_roles ADD COLUMN can_edit_role_color TINYINT(1) DEFAULT 0 COMMENT '编辑角色颜色';
ALTER TABLE project_roles ADD COLUMN can_edit_role_perms TINYINT(1) DEFAULT 0 COMMENT '编辑角色权限';
ALTER TABLE project_roles ADD COLUMN can_delete_role TINYINT(1) DEFAULT 0 COMMENT '删除角色';

-- 创建任务（can_create_task 保留，新增1个兄弟列）
ALTER TABLE project_roles ADD COLUMN can_create_task_with_attachment TINYINT(1) DEFAULT 0 COMMENT '创建任务时上传附件';

-- 删除任务（can_delete_task 保留，新增2个兄弟列）
ALTER TABLE project_roles ADD COLUMN can_view_task_trash TINYINT(1) DEFAULT 0 COMMENT '查看任务回收站';
ALTER TABLE project_roles ADD COLUMN can_restore_task TINYINT(1) DEFAULT 0 COMMENT '恢复已删除任务';

-- 任务状态流转（拆分自 can_manage_task_flow）
ALTER TABLE project_roles ADD COLUMN can_move_task_accept TINYINT(1) DEFAULT 0 COMMENT '接受任务 submitted→in_progress';
ALTER TABLE project_roles ADD COLUMN can_move_task_dispute TINYINT(1) DEFAULT 0 COMMENT '提疑问 submitted→disputed';
ALTER TABLE project_roles ADD COLUMN can_move_task_supplement TINYINT(1) DEFAULT 0 COMMENT '补充 disputed→submitted';
ALTER TABLE project_roles ADD COLUMN can_move_task_submit_review TINYINT(1) DEFAULT 0 COMMENT '提交验收 in_progress→pending_review';
ALTER TABLE project_roles ADD COLUMN can_move_task_reject TINYINT(1) DEFAULT 0 COMMENT '驳回验收 pending_review→review_failed';
ALTER TABLE project_roles ADD COLUMN can_move_task_approve TINYINT(1) DEFAULT 0 COMMENT '验收通过 pending_review→accepted';
ALTER TABLE project_roles ADD COLUMN can_move_task_resubmit TINYINT(1) DEFAULT 0 COMMENT '重新验收 review_failed→pending_review';

-- 任务编辑（拆分自 can_manage_task_flow）
ALTER TABLE project_roles ADD COLUMN can_edit_task_title TINYINT(1) DEFAULT 0 COMMENT '编辑任务标题';
ALTER TABLE project_roles ADD COLUMN can_edit_task_desc TINYINT(1) DEFAULT 0 COMMENT '编辑任务描述';
ALTER TABLE project_roles ADD COLUMN can_edit_task_priority TINYINT(1) DEFAULT 0 COMMENT '编辑任务优先级';
ALTER TABLE project_roles ADD COLUMN can_edit_task_deadline TINYINT(1) DEFAULT 0 COMMENT '编辑任务截止日期';
ALTER TABLE project_roles ADD COLUMN can_assign_task TINYINT(1) DEFAULT 0 COMMENT '指派/变更负责人';

-- 任务附件（拆分自 can_manage_task_flow）
ALTER TABLE project_roles ADD COLUMN can_upload_task_attachment TINYINT(1) DEFAULT 0 COMMENT '上传任务附件';
ALTER TABLE project_roles ADD COLUMN can_delete_task_attachment TINYINT(1) DEFAULT 0 COMMENT '删除任务附件';

-- 审核要点（拆分自 can_manage_task_flow）
ALTER TABLE project_roles ADD COLUMN can_add_review_point TINYINT(1) DEFAULT 0 COMMENT '添加审核要点';
ALTER TABLE project_roles ADD COLUMN can_respond_review_point TINYINT(1) DEFAULT 0 COMMENT '回复审核要点';
ALTER TABLE project_roles ADD COLUMN can_confirm_review_point TINYINT(1) DEFAULT 0 COMMENT '确认审核要点';

-- 任务预设标题（拆分自 can_manage_task_preset）
ALTER TABLE project_roles ADD COLUMN can_view_title_options TINYINT(1) DEFAULT 0 COMMENT '查看标题选项';
ALTER TABLE project_roles ADD COLUMN can_record_title_history TINYINT(1) DEFAULT 0 COMMENT '记录历史标题';
ALTER TABLE project_roles ADD COLUMN can_delete_title_history TINYINT(1) DEFAULT 0 COMMENT '删除历史标题';
ALTER TABLE project_roles ADD COLUMN can_edit_title_presets TINYINT(1) DEFAULT 0 COMMENT '编辑预设模板';

-- 里程碑（拆分自 can_manage_milestone）
ALTER TABLE project_roles ADD COLUMN can_create_milestone TINYINT(1) DEFAULT 0 COMMENT '创建里程碑';
ALTER TABLE project_roles ADD COLUMN can_edit_milestone TINYINT(1) DEFAULT 0 COMMENT '编辑里程碑';
ALTER TABLE project_roles ADD COLUMN can_delete_milestone TINYINT(1) DEFAULT 0 COMMENT '删除里程碑';
ALTER TABLE project_roles ADD COLUMN can_toggle_milestone TINYINT(1) DEFAULT 0 COMMENT '切换里程碑完成状态';

-- 报表（can_view_report 保留，新增1个兄弟列）
ALTER TABLE project_roles ADD COLUMN can_export_data TINYINT(1) DEFAULT 0 COMMENT '导出项目数据';

-- 应用（拆分自 can_manage_app）
ALTER TABLE project_roles ADD COLUMN can_manage_app_config TINYINT(1) DEFAULT 0 COMMENT '管理应用配置';
ALTER TABLE project_roles ADD COLUMN can_manage_app_integration TINYINT(1) DEFAULT 0 COMMENT '管理集成设置';

-- ========== 2. 数据迁移：将旧字段值展开到新字段 ==========

-- can_edit_project → 3个
UPDATE project_roles SET can_edit_project_name = can_edit_project, can_edit_project_desc = can_edit_project, can_edit_project_status = can_edit_project WHERE can_edit_project IS NOT NULL;

-- can_set_client → 3个
UPDATE project_roles SET can_send_client_request = can_set_client, can_cancel_client_link = can_set_client, can_change_client_link = can_set_client WHERE can_set_client IS NOT NULL;

-- can_add_member 保留，展开到兄弟
UPDATE project_roles SET can_assign_member_legacy_role = can_add_member, can_assign_member_ent_role = can_add_member, can_assign_member_proj_role = can_add_member WHERE can_add_member IS NOT NULL;

-- can_update_member_role → 3个
UPDATE project_roles SET can_update_member_legacy_role = can_update_member_role, can_update_member_ent_role = can_update_member_role, can_update_member_proj_role = can_update_member_role WHERE can_update_member_role IS NOT NULL;

-- can_manage_client_member → 3个
UPDATE project_roles SET can_view_client_users = can_manage_client_member, can_add_client_member = can_manage_client_member, can_remove_client_member = can_manage_client_member WHERE can_manage_client_member IS NOT NULL;

-- can_approve_join 保留，展开到兄弟
UPDATE project_roles SET can_view_join_requests = can_approve_join, can_reject_join = can_approve_join WHERE can_approve_join IS NOT NULL;

-- can_manage_roles → 5个
UPDATE project_roles SET can_create_role = can_manage_roles, can_edit_role_name = can_manage_roles, can_edit_role_color = can_manage_roles, can_edit_role_perms = can_manage_roles, can_delete_role = can_manage_roles WHERE can_manage_roles IS NOT NULL;

-- can_create_task 保留，展开到兄弟
UPDATE project_roles SET can_create_task_with_attachment = can_create_task WHERE can_create_task IS NOT NULL;

-- can_delete_task 保留，展开到兄弟
UPDATE project_roles SET can_view_task_trash = can_delete_task, can_restore_task = can_delete_task WHERE can_delete_task IS NOT NULL;

-- can_manage_task_flow → 17个
UPDATE project_roles SET
  can_move_task_accept = can_manage_task_flow, can_move_task_dispute = can_manage_task_flow,
  can_move_task_supplement = can_manage_task_flow, can_move_task_submit_review = can_manage_task_flow,
  can_move_task_reject = can_manage_task_flow, can_move_task_approve = can_manage_task_flow,
  can_move_task_resubmit = can_manage_task_flow,
  can_edit_task_title = can_manage_task_flow, can_edit_task_desc = can_manage_task_flow,
  can_edit_task_priority = can_manage_task_flow, can_edit_task_deadline = can_manage_task_flow,
  can_assign_task = can_manage_task_flow,
  can_upload_task_attachment = can_manage_task_flow, can_delete_task_attachment = can_manage_task_flow,
  can_add_review_point = can_manage_task_flow, can_respond_review_point = can_manage_task_flow,
  can_confirm_review_point = can_manage_task_flow
WHERE can_manage_task_flow IS NOT NULL;

-- can_manage_task_preset → 4个
UPDATE project_roles SET can_view_title_options = can_manage_task_preset, can_record_title_history = can_manage_task_preset, can_delete_title_history = can_manage_task_preset, can_edit_title_presets = can_manage_task_preset WHERE can_manage_task_preset IS NOT NULL;

-- can_manage_milestone → 4个
UPDATE project_roles SET can_create_milestone = can_manage_milestone, can_edit_milestone = can_manage_milestone, can_delete_milestone = can_manage_milestone, can_toggle_milestone = can_manage_milestone WHERE can_manage_milestone IS NOT NULL;

-- can_view_report 保留，展开到兄弟
UPDATE project_roles SET can_export_data = can_view_report WHERE can_view_report IS NOT NULL;

-- can_manage_app → 2个
UPDATE project_roles SET can_manage_app_config = can_manage_app, can_manage_app_integration = can_manage_app WHERE can_manage_app IS NOT NULL;

-- ========== 3. 删除旧字段（被完全替代的 9 个） ==========
ALTER TABLE project_roles DROP COLUMN can_edit_project;
ALTER TABLE project_roles DROP COLUMN can_set_client;
ALTER TABLE project_roles DROP COLUMN can_update_member_role;
ALTER TABLE project_roles DROP COLUMN can_manage_client_member;
ALTER TABLE project_roles DROP COLUMN can_manage_roles;
ALTER TABLE project_roles DROP COLUMN can_manage_task_flow;
ALTER TABLE project_roles DROP COLUMN can_manage_task_preset;
ALTER TABLE project_roles DROP COLUMN can_manage_milestone;
ALTER TABLE project_roles DROP COLUMN can_manage_app;
