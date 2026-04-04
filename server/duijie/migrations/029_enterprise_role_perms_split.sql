-- 029_enterprise_role_perms_split.sql
-- 确保 enterprise_roles 表拥有企业级权限列（与项目角色权限分离）
-- migrate.js 会自动忽略重复列错误

-- 恢复被 027 删除的企业级列
ALTER TABLE enterprise_roles ADD COLUMN can_manage_members TINYINT(1) DEFAULT 0 COMMENT '管理企业成员';

-- 新增企业级权限列
ALTER TABLE enterprise_roles ADD COLUMN can_approve_join TINYINT(1) DEFAULT 0 COMMENT '审批加入申请';
ALTER TABLE enterprise_roles ADD COLUMN can_manage_app TINYINT(1) DEFAULT 0 COMMENT '管理应用';

-- 为已有的默认管理员角色开启新权限
UPDATE enterprise_roles SET can_manage_members = 1, can_approve_join = 1, can_manage_app = 1
WHERE is_default = 1 AND name = '管理员' AND is_deleted = 0;
