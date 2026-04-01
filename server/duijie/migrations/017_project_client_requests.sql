-- 项目关联客户企业的审批请求表
CREATE TABLE IF NOT EXISTS duijie_project_client_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '项目ID',
  from_enterprise_id INT NOT NULL COMMENT '发起方企业ID (internal_client_id)',
  to_enterprise_id INT NOT NULL COMMENT '目标企业ID (要成为client_id的企业)',
  requested_by INT NOT NULL COMMENT '发起人用户ID',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  handled_by INT DEFAULT NULL COMMENT '处理人用户ID',
  handled_at DATETIME DEFAULT NULL,
  message VARCHAR(500) DEFAULT NULL COMMENT '邀请留言',
  reject_reason VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project (project_id),
  INDEX idx_to_enterprise (to_enterprise_id, status),
  INDEX idx_from_enterprise (from_enterprise_id),
  UNIQUE KEY uk_pending (project_id, to_enterprise_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目关联客户企业审批请求';
