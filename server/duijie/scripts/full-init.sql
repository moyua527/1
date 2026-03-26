-- DuiJie 完整数据库初始化脚本
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS voice_room_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voice_room_db;

-- 用户表
CREATE TABLE IF NOT EXISTS voice_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  avatar VARCHAR(500),
  role ENUM('admin','tech','business','member') DEFAULT 'member',
  client_id INT DEFAULT NULL COMMENT '关联客户ID(仅client角色)',
  display_id VARCHAR(30) DEFAULT NULL COMMENT '展示用唯一ID(86+地区码+日期+序号+校验位)',
  gender TINYINT DEFAULT NULL COMMENT '1=男 2=女',
  area_code VARCHAR(6) DEFAULT NULL COMMENT '6位行政区划代码',
  user_type VARCHAR(20) DEFAULT 'individual' COMMENT '用户类型: individual/company',
  province VARCHAR(50) DEFAULT NULL COMMENT '省份',
  city VARCHAR(50) DEFAULT NULL COMMENT '城市',
  position VARCHAR(100) DEFAULT NULL COMMENT '职位(企业用户)',
  personal_invite_code VARCHAR(8) DEFAULT NULL UNIQUE COMMENT '专属邀请码',
  invited_by INT DEFAULT NULL COMMENT '邀请人用户ID',
  totp_secret VARCHAR(64) DEFAULT NULL COMMENT 'TOTP密钥(base32)',
  totp_enabled TINYINT(1) DEFAULT 0 COMMENT '是否启用2FA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 客户表
CREATE TABLE IF NOT EXISTS duijie_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  client_type VARCHAR(20) DEFAULT 'company',
  name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(50),
  channel VARCHAR(100),
  stage VARCHAR(20) DEFAULT 'potential',
  position_level VARCHAR(50),
  department VARCHAR(100),
  job_function VARCHAR(100),
  avatar VARCHAR(500),
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_created_by (created_by),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 客户成员表
CREATE TABLE IF NOT EXISTS duijie_client_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL COMMENT '关联客户',
  name VARCHAR(100) NOT NULL COMMENT '成员姓名',
  position VARCHAR(100) COMMENT '职位',
  department VARCHAR(100) COMMENT '部门',
  phone VARCHAR(30) COMMENT '电话',
  email VARCHAR(200) COMMENT '邮箱',
  notes TEXT COMMENT '备注',
  created_by INT COMMENT '添加人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目表
CREATE TABLE IF NOT EXISTS duijie_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  client_id INT DEFAULT NULL,
  status ENUM('planning','in_progress','review','completed','on_hold') DEFAULT 'planning',
  progress TINYINT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2) DEFAULT 0,
  tags VARCHAR(500),
  app_name VARCHAR(100) COMMENT '应用名称',
  app_url VARCHAR(500) COMMENT '应用链接',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 任务表
CREATE TABLE IF NOT EXISTS duijie_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('todo','in_progress','pending_review','accepted') DEFAULT 'todo',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  assignee_id INT,
  due_date DATE,
  sort_order INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_assignee_id (assignee_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 里程碑表
CREATE TABLE IF NOT EXISTS duijie_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  is_completed TINYINT(1) DEFAULT 0,
  completed_at TIMESTAMP NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 文件表
CREATE TABLE IF NOT EXISTS duijie_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NULL,
  name VARCHAR(300) NOT NULL,
  original_name VARCHAR(300),
  size BIGINT DEFAULT 0,
  mime_type VARCHAR(100),
  path VARCHAR(500) NOT NULL,
  version INT DEFAULT 1,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 消息表
CREATE TABLE IF NOT EXISTS duijie_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  type ENUM('text','file','system') DEFAULT 'text',
  is_client_visible TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目成员关联表
CREATE TABLE IF NOT EXISTS duijie_project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner','editor','viewer') DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_project_user (project_id, user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 联系人表
CREATE TABLE IF NOT EXISTS duijie_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(200),
  wechat VARCHAR(100),
  is_primary TINYINT(1) DEFAULT 0,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 合同表
CREATE TABLE IF NOT EXISTS duijie_contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  status ENUM('draft','active','expired','terminated') DEFAULT 'draft',
  signed_date DATE,
  expire_date DATE,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 跟进记录表
CREATE TABLE IF NOT EXISTS duijie_follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  content TEXT NOT NULL,
  follow_type ENUM('phone','visit','email','wechat','other') DEFAULT 'phone',
  next_follow_date DATE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id),
  INDEX idx_next_follow_date (next_follow_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 标签表
CREATE TABLE IF NOT EXISTS duijie_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) DEFAULT '#6b7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 客户-标签关联表
CREATE TABLE IF NOT EXISTS duijie_client_tags (
  client_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (client_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 客户变更日志表
CREATE TABLE IF NOT EXISTS duijie_client_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  field_name VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 种子数据 ==========

-- JWT密钥
INSERT INTO system_config (config_key, config_value) VALUES ('JWT_SECRET', 'duijie_jwt_secret_2024');
INSERT INTO system_config (config_key, config_value) VALUES ('INVITE_CODE', 'duijie2024');

-- 用户 (admin/admin123, test/test123, yonghu/yonghu123)
INSERT INTO voice_users (username, password, nickname, role, client_id) VALUES
('admin', 'admin123', '管理员', 'admin', NULL),
('test', 'test123', 'Test User', 'member', NULL);

-- 客户
INSERT INTO duijie_clients (name, company, email, phone, channel, stage, created_by) VALUES
('Boss直聘', '北京华品博睿网络技术有限公司', '', '', '线上', 'potential', 1),
('微信', '深圳市腾讯计算机系统有限公司', '', '', '线上', 'potential', 1),
('抖音', '北京微播视界科技有限公司', '', '', '线上', 'potential', 1),
('小红书', '行吟信息科技(上海)有限公司', '', '', '线上', 'potential', 1),
('淘宝', '浙江淘宝网络有限公司', '', '', '线上', 'potential', 1),
('拼多多', '上海寻梦信息技术有限公司', '', '', '线上', 'potential', 1);

-- 普通成员用户
INSERT INTO voice_users (username, password, nickname, role, client_id) VALUES
('yonghu', 'yonghu123', '用户', 'member', NULL);

-- 示例项目
INSERT INTO duijie_projects (name, description, client_id, status, created_by) VALUES
('示例项目', '这是一个示例项目', 1, 'in_progress', 1);

-- 管理员加入项目
INSERT INTO duijie_project_members (project_id, user_id, role) VALUES (1, 1, 'owner');

-- Test User 加入项目
INSERT INTO duijie_project_members (project_id, user_id, role) VALUES (1, 2, 'editor');
