ALTER TABLE project_roles
  ADD COLUMN can_upload_file TINYINT(1) DEFAULT 0 COMMENT '上传文件/链接/笔记',
  ADD COLUMN can_delete_file TINYINT(1) DEFAULT 0 COMMENT '删除文件',
  ADD COLUMN can_manage_resource_group TINYINT(1) DEFAULT 0 COMMENT '管理资源分组';

UPDATE project_roles SET can_upload_file = 1, can_delete_file = 1, can_manage_resource_group = 1
WHERE role_key IN ('owner', 'editor');
