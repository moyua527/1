CREATE TABLE IF NOT EXISTS duijie_custom_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  field_type ENUM('text','number','date','amount','select','multi_select') NOT NULL DEFAULT 'text',
  options JSON,
  required TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project (project_id),
  INDEX idx_sort (project_id, sort_order)
);

CREATE TABLE IF NOT EXISTS duijie_custom_field_values (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  field_id INT NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_task_field (task_id, field_id),
  INDEX idx_field (field_id)
);
