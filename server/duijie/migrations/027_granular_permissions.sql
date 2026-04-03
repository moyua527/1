-- 027_granular_permissions.sql
-- 将旧的7个粗粒度权限字段替换为16个细粒度操作级权限

-- ========== project_roles 表 ==========
-- 删除旧字段
ALTER TABLE project_roles DROP COLUMN IF EXISTS can_manage_members;
ALTER TABLE project_roles DROP COLUMN IF EXISTS can_manage_client;
ALTER TABLE project_roles DROP COLUMN IF EXISTS can_manage_task;

-- 添加新字段（保留 can_edit_project, can_delete_project, can_manage_roles, can_view_report）
-- 成员管理（拆分自 can_manage_members）
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_add_member TINYINT(1) DEFAULT 0 COMMENT '添加内部成员';
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_remove_member TINYINT(1) DEFAULT 0 COMMENT '移除内部成员';
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_update_member_role TINYINT(1) DEFAULT 0 COMMENT '更新成员角色';
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_manage_client_member TINYINT(1) DEFAULT 0 COMMENT '添加/移除客户方成员';
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_approve_join TINYINT(1) DEFAULT 0 COMMENT '审批/拒绝加入申请';
-- 客户企业（拆分自 can_manage_client + can_edit_project）
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_set_client TINYINT(1) DEFAULT 0 COMMENT '设置/更换客户企业';
-- 任务管理（拆分自 can_manage_task）
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_create_task TINYINT(1) DEFAULT 0 COMMENT '创建任务';
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_delete_task TINYINT(1) DEFAULT 0 COMMENT '删除任务';
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_manage_task_flow TINYINT(1) DEFAULT 0 COMMENT '任务状态流转';
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_manage_task_preset TINYINT(1) DEFAULT 0 COMMENT '管理任务标题预设';
-- 里程碑
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_manage_milestone TINYINT(1) DEFAULT 0 COMMENT '创建/编辑/完成/删除里程碑';
-- 应用
ALTER TABLE project_roles ADD COLUMN IF NOT EXISTS can_manage_app TINYINT(1) DEFAULT 0 COMMENT '添加/编辑/移除应用';

-- 更新 Owner 默认角色：所有权限开启
UPDATE project_roles SET
  can_add_member = 1, can_remove_member = 1, can_update_member_role = 1,
  can_manage_client_member = 1, can_approve_join = 1, can_set_client = 1,
  can_create_task = 1, can_delete_task = 1, can_manage_task_flow = 1, can_manage_task_preset = 1,
  can_manage_milestone = 1, can_manage_app = 1
WHERE role_key = 'owner' AND is_deleted = 0;

-- 更新 Editor 默认角色：任务相关权限
UPDATE project_roles SET
  can_create_task = 1, can_delete_task = 1, can_manage_task_flow = 1, can_manage_task_preset = 1
WHERE role_key = 'editor' AND is_deleted = 0;

-- Viewer 默认全部为 0，不需要更新

-- ========== enterprise_roles 表（同步更新）==========
ALTER TABLE enterprise_roles DROP COLUMN IF EXISTS can_manage_members;
ALTER TABLE enterprise_roles DROP COLUMN IF EXISTS can_manage_client;
ALTER TABLE enterprise_roles DROP COLUMN IF EXISTS can_manage_task;

ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_add_member TINYINT(1) DEFAULT 0 COMMENT '添加内部成员';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_remove_member TINYINT(1) DEFAULT 0 COMMENT '移除内部成员';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_update_member_role TINYINT(1) DEFAULT 0 COMMENT '更新成员角色';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_manage_client_member TINYINT(1) DEFAULT 0 COMMENT '添加/移除客户方成员';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_approve_join TINYINT(1) DEFAULT 0 COMMENT '审批/拒绝加入申请';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_set_client TINYINT(1) DEFAULT 0 COMMENT '设置/更换客户企业';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_create_task TINYINT(1) DEFAULT 0 COMMENT '创建任务';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_delete_task TINYINT(1) DEFAULT 0 COMMENT '删除任务';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_manage_task_flow TINYINT(1) DEFAULT 0 COMMENT '任务状态流转';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_manage_task_preset TINYINT(1) DEFAULT 0 COMMENT '管理任务标题预设';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_manage_milestone TINYINT(1) DEFAULT 0 COMMENT '创建/编辑/完成/删除里程碑';
ALTER TABLE enterprise_roles ADD COLUMN IF NOT EXISTS can_manage_app TINYINT(1) DEFAULT 0 COMMENT '添加/编辑/移除应用';
