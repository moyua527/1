CREATE TABLE IF NOT EXISTS duijie_device_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform VARCHAR(20) NOT NULL COMMENT 'android/ios/web',
  device_token VARCHAR(255) NOT NULL,
  app_version VARCHAR(30) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_device_token (device_token),
  KEY idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
