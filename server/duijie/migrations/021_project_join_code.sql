-- 为项目添加 join_code (项目唯一ID/邀请码)
ALTER TABLE duijie_projects
  ADD COLUMN join_code VARCHAR(20) DEFAULT NULL AFTER tags;

-- 为现有项目生成唯一码
UPDATE duijie_projects
SET join_code = UPPER(SUBSTRING(SHA2(CONCAT(id, '-', UNIX_TIMESTAMP(created_at), '-', RAND()), 256), 1, 8))
WHERE is_deleted = 0 AND (join_code IS NULL OR join_code = '');

-- 唯一索引
CREATE UNIQUE INDEX idx_duijie_projects_join_code ON duijie_projects (join_code);

-- 项目加入申请表
CREATE TABLE IF NOT EXISTS duijie_project_join_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  message VARCHAR(500) DEFAULT '' COMMENT '申请留言',
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by INT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  UNIQUE KEY uk_project_user_pending (project_id, user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目加入申请';
