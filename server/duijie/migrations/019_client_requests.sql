-- 客户添加请求表：企业A向企业B发送添加客户请求，需B方审批
CREATE TABLE IF NOT EXISTS duijie_client_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_enterprise_id INT NOT NULL COMMENT '发起方企业ID (duijie_clients.id)',
  to_enterprise_id INT NOT NULL COMMENT '目标企业ID (duijie_clients.id)',
  project_id INT DEFAULT NULL COMMENT '关联项目ID (duijie_projects.id)，审批通过后自动设置项目client_id',
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  message VARCHAR(500) DEFAULT NULL COMMENT '附言',
  created_by INT NOT NULL COMMENT '发起人 (voice_users.id)',
  handled_by INT DEFAULT NULL COMMENT '处理人 (voice_users.id)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  handled_at TIMESTAMP NULL DEFAULT NULL,
  KEY idx_to_status (to_enterprise_id, status),
  KEY idx_from (from_enterprise_id),
  KEY idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
