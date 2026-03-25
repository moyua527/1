-- 合作方 API Key 管理表
CREATE TABLE IF NOT EXISTS duijie_partner_api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_name VARCHAR(100) NOT NULL COMMENT '合作方名称（如：货联、本地桥）',
  api_key VARCHAR(64) NOT NULL UNIQUE COMMENT '分配给合作方的 API Key',
  partner_url VARCHAR(500) DEFAULT NULL COMMENT '合作方后端地址（用于调对方接口）',
  partner_key VARCHAR(200) DEFAULT NULL COMMENT '对方给我们的 API Key（用于调对方接口）',
  permissions JSON DEFAULT NULL COMMENT '允许访问的接口列表，如 ["clients:read","projects:read"]',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  last_used_at DATETIME DEFAULT NULL COMMENT '最后调用时间',
  call_count INT DEFAULT 0 COMMENT '累计调用次数',
  created_by INT DEFAULT NULL COMMENT '创建人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  notes TEXT DEFAULT NULL COMMENT '备注'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合作方 API Key 管理';
