CREATE TABLE IF NOT EXISTS duijie_task_drafts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NOT NULL,
  user_id     INT NOT NULL,
  title       VARCHAR(500) DEFAULT '',
  description TEXT,
  files       JSON,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_user (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
