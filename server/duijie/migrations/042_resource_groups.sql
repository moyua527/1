CREATE TABLE IF NOT EXISTS duijie_resource_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  visibility ENUM('all','selected') DEFAULT 'all',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS duijie_resource_group_visibility (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  UNIQUE KEY uk_group_user (group_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE duijie_files ADD COLUMN resource_group_id INT DEFAULT NULL AFTER project_id;
ALTER TABLE duijie_files ADD INDEX idx_resource_group (resource_group_id);
