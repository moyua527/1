-- 项目成员表增加企业角色字段，实现项目级权限（第二身份）
ALTER TABLE duijie_project_members
  ADD COLUMN enterprise_role_id INT DEFAULT NULL COMMENT '项目内企业角色ID(来自enterprise_roles)';
