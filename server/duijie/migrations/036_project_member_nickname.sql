ALTER TABLE duijie_project_members
  ADD COLUMN nickname VARCHAR(100) DEFAULT NULL COMMENT '用户对项目的自定义备注名'
  AFTER project_role_id;
