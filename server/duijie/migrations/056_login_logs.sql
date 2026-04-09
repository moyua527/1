CREATE TABLE IF NOT EXISTS duijie_login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  login_type VARCHAR(20) NOT NULL DEFAULT 'password' COMMENT 'password/code',
  ip VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  device_name VARCHAR(100) DEFAULT NULL,
  status ENUM('success','failed') DEFAULT 'success',
  fail_reason VARCHAR(200) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
