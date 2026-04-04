-- 030_enterprise_dept_edit_perms.sql
-- 新增企业级权限：管理部门、编辑企业信息

ALTER TABLE enterprise_roles ADD COLUMN can_manage_department TINYINT(1) DEFAULT 0 COMMENT '管理部门（创建/编辑/删除）';
ALTER TABLE enterprise_roles ADD COLUMN can_edit_enterprise TINYINT(1) DEFAULT 0 COMMENT '编辑企业信息';

-- 为已有的默认管理员角色开启新权限
UPDATE enterprise_roles SET can_manage_department = 1, can_edit_enterprise = 1
WHERE is_default = 1 AND name = '管理员' AND is_deleted = 0;
