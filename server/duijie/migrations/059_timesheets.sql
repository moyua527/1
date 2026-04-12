CREATE TABLE IF NOT EXISTS duijie_timesheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT DEFAULT NULL,
  project_id INT NOT NULL,
  work_date DATE NOT NULL,
  hours DECIMAL(4,1) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_user_date (user_id, work_date),
  INDEX idx_project (project_id),
  INDEX idx_task (task_id)
);
