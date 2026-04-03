CREATE TABLE IF NOT EXISTS user_nicknames (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '设置备注的用户',
  target_user_id INT NOT NULL COMMENT '被设置备注的用户',
  nickname VARCHAR(50) NOT NULL COMMENT '备注名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_target (user_id, target_user_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
