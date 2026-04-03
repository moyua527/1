CREATE TABLE IF NOT EXISTS project_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  role_key VARCHAR(20) DEFAULT NULL,
  name VARCHAR(50) NOT NULL,
  can_manage_members TINYINT(1) DEFAULT 0,
  can_manage_roles TINYINT(1) DEFAULT 0,
  can_edit_project TINYINT(1) DEFAULT 0,
  can_delete_project TINYINT(1) DEFAULT 0,
  can_manage_client TINYINT(1) DEFAULT 0,
  can_view_report TINYINT(1) DEFAULT 0,
  can_manage_task TINYINT(1) DEFAULT 0,
  color VARCHAR(20) DEFAULT '#64748b',
  sort_order INT DEFAULT 0,
  is_default TINYINT(1) DEFAULT 0,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE duijie_project_members
  ADD COLUMN project_role_id INT DEFAULT NULL COMMENT '项目自定义角色ID';
