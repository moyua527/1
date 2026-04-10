-- 1. 企业表加 display_id
ALTER TABLE duijie_clients ADD COLUMN display_id VARCHAR(10) DEFAULT NULL COMMENT '展示ID: q+6位';
ALTER TABLE duijie_clients ADD UNIQUE INDEX uk_display_id (display_id);

-- 2. 项目表加 display_id
ALTER TABLE duijie_projects ADD COLUMN display_id VARCHAR(12) DEFAULT NULL COMMENT '展示ID: x+8-9位';
ALTER TABLE duijie_projects ADD UNIQUE INDEX uk_display_id (display_id);

-- 3. 平台角色清理：移除 tech/business
UPDATE voice_users SET role = 'member' WHERE role IN ('tech', 'business');
ALTER TABLE voice_users MODIFY role ENUM('admin','member') DEFAULT 'member';

-- 4. 企业默认角色重命名
UPDATE enterprise_roles SET name = '企业创建者' WHERE name = '管理员' AND is_default = 1;
UPDATE enterprise_roles SET name = '企业成员' WHERE name = '普通成员' AND is_default = 1;

-- 5. 项目默认角色重命名
UPDATE project_roles SET name = '项目负责人' WHERE role_key = 'creator' OR (name IN ('创建者', '项目管理员') AND is_default = 1);
UPDATE project_roles SET name = '项目编辑' WHERE role_key = 'editor' OR (name IN ('编辑者', '开发者') AND is_default = 1);
UPDATE project_roles SET name = '项目查看' WHERE role_key = 'viewer' OR (name IN ('查看者', '观察者', '观察员') AND is_default = 1);
