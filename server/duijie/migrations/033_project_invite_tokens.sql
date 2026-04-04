CREATE TABLE IF NOT EXISTS duijie_project_invite_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  created_by INT NOT NULL,
  used_by INT DEFAULT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
