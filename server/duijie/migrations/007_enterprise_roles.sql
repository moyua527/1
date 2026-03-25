CREATE TABLE IF NOT EXISTS enterprise_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enterprise_id INT NOT NULL COMMENT '所属企业(duijie_clients.id)',
  name VARCHAR(50) NOT NULL COMMENT '角色名称(自定义)',
  can_manage_members TINYINT(1) DEFAULT 0 COMMENT '管理成员(增删改)',
  can_manage_roles TINYINT(1) DEFAULT 0 COMMENT '管理角色',
  can_create_project TINYINT(1) DEFAULT 0 COMMENT '创建项目',
  can_edit_project TINYINT(1) DEFAULT 0 COMMENT '编辑项目',
  can_delete_project TINYINT(1) DEFAULT 0 COMMENT '删除项目',
  can_manage_client TINYINT(1) DEFAULT 0 COMMENT '管理客户',
  can_view_report TINYINT(1) DEFAULT 0 COMMENT '查看报表',
  can_manage_task TINYINT(1) DEFAULT 0 COMMENT '管理任务',
  color VARCHAR(20) DEFAULT '#64748b',
  sort_order INT DEFAULT 0,
  is_default TINYINT(1) DEFAULT 0 COMMENT '默认角色不可删除',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_enterprise (enterprise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE duijie_client_members
  ADD COLUMN enterprise_role_id INT DEFAULT NULL COMMENT '自定义角色ID';
