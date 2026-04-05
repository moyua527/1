-- 代办进度记录表
CREATE TABLE IF NOT EXISTS duijie_milestone_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_id INT NOT NULL,
  content TEXT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_milestone_id (milestone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 代办参与人表
CREATE TABLE IF NOT EXISTS duijie_milestone_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_milestone_user (milestone_id, user_id),
  INDEX idx_milestone_id (milestone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 代办提醒表
CREATE TABLE IF NOT EXISTS duijie_milestone_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_id INT NOT NULL,
  user_id INT NOT NULL,
  remind_at DATETIME NOT NULL,
  note VARCHAR(500) DEFAULT '',
  is_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_milestone_id (milestone_id),
  INDEX idx_remind_at (remind_at, is_sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
