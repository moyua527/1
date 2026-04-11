CREATE TABLE IF NOT EXISTS duijie_project_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL COMMENT '操作类型: task_created/task_status/member_added/file_uploaded/message_sent/milestone_done/project_updated',
  entity_type VARCHAR(30) COMMENT '实体类型: task/member/file/message/milestone/project',
  entity_id INT COMMENT '实体ID',
  title VARCHAR(500) COMMENT '摘要文字',
  detail TEXT COMMENT 'JSON附加数据',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_time (project_id, created_at DESC),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
