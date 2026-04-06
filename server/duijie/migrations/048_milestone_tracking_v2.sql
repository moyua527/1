-- 代办参与人
CREATE TABLE IF NOT EXISTS duijie_milestone_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ms_user (milestone_id, user_id),
  INDEX idx_milestone (milestone_id),
  INDEX idx_user (user_id)
);

-- 代办跟踪消息（进度记录）
CREATE TABLE IF NOT EXISTS duijie_milestone_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  mentioned_users JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_milestone (milestone_id),
  INDEX idx_user (user_id)
);

-- 代办提醒
CREATE TABLE IF NOT EXISTS duijie_milestone_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_id INT NOT NULL,
  user_id INT NOT NULL,
  remind_at DATETIME NOT NULL,
  message VARCHAR(500) DEFAULT NULL,
  is_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_milestone (milestone_id),
  INDEX idx_remind (is_sent, remind_at)
);
