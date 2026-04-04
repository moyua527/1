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
  internal_client_id INT DEFAULT NULL,
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
  INDEX idx_internal_client_id (internal_client_id),
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
  status ENUM('todo','submitted','disputed','in_progress','pending_review','review_failed','accepted') DEFAULT 'submitted',
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

-- 项目关联客户企业审批请求表
CREATE TABLE IF NOT EXISTS duijie_project_client_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '项目ID',
  from_enterprise_id INT NOT NULL COMMENT '发起方企业ID',
  to_enterprise_id INT NOT NULL COMMENT '目标企业ID',
  requested_by INT NOT NULL COMMENT '发起人用户ID',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  handled_by INT DEFAULT NULL,
  handled_at DATETIME DEFAULT NULL,
  message VARCHAR(500) DEFAULT NULL,
  reject_reason VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project (project_id),
  INDEX idx_to_enterprise (to_enterprise_id, status),
  INDEX idx_from_enterprise (from_enterprise_id),
  UNIQUE KEY uk_pending (project_id, to_enterprise_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 通用客户添加审批请求表
CREATE TABLE IF NOT EXISTS duijie_client_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_enterprise_id INT NOT NULL COMMENT '发起方企业ID',
  to_enterprise_id INT NOT NULL COMMENT '目标企业ID',
  project_id INT DEFAULT NULL COMMENT '关联项目ID',
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  message VARCHAR(500) DEFAULT NULL,
  created_by INT NOT NULL,
  handled_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  handled_at TIMESTAMP NULL DEFAULT NULL,
  KEY idx_to_status (to_enterprise_id, status),
  KEY idx_from (from_enterprise_id),
  KEY idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目角色表
CREATE TABLE IF NOT EXISTS project_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  role_key VARCHAR(20) DEFAULT NULL,
  name VARCHAR(50) NOT NULL,
  -- 项目信息管理
  can_edit_project_name TINYINT(1) DEFAULT 0 COMMENT '修改项目名称',
  can_edit_project_desc TINYINT(1) DEFAULT 0 COMMENT '修改项目描述',
  can_edit_project_status TINYINT(1) DEFAULT 0 COMMENT '修改项目状态',
  can_delete_project TINYINT(1) DEFAULT 0 COMMENT '删除项目',
  -- 关联客户企业
  can_send_client_request TINYINT(1) DEFAULT 0 COMMENT '发起关联客户企业请求',
  can_cancel_client_link TINYINT(1) DEFAULT 0 COMMENT '取消客户企业关联',
  can_change_client_link TINYINT(1) DEFAULT 0 COMMENT '变更客户企业',
  -- 我方成员管理
  can_add_member TINYINT(1) DEFAULT 0 COMMENT '添加内部成员',
  can_assign_member_legacy_role TINYINT(1) DEFAULT 0 COMMENT '添加时指定遗留角色',
  can_assign_member_ent_role TINYINT(1) DEFAULT 0 COMMENT '添加时分配企业角色',
  can_assign_member_proj_role TINYINT(1) DEFAULT 0 COMMENT '添加时分配项目角色',
  can_remove_member TINYINT(1) DEFAULT 0 COMMENT '移除内部成员',
  -- 修改成员角色
  can_update_member_legacy_role TINYINT(1) DEFAULT 0 COMMENT '修改成员遗留角色',
  can_update_member_ent_role TINYINT(1) DEFAULT 0 COMMENT '修改成员企业角色',
  can_update_member_proj_role TINYINT(1) DEFAULT 0 COMMENT '修改成员项目角色',
  -- 客户方成员
  can_view_client_users TINYINT(1) DEFAULT 0 COMMENT '查看客户企业可用用户',
  can_add_client_member TINYINT(1) DEFAULT 0 COMMENT '添加客户方成员',
  can_remove_client_member TINYINT(1) DEFAULT 0 COMMENT '移除客户方成员',
  -- 加入审批
  can_view_join_requests TINYINT(1) DEFAULT 0 COMMENT '查看待审批列表',
  can_approve_join TINYINT(1) DEFAULT 0 COMMENT '批准加入申请',
  can_reject_join TINYINT(1) DEFAULT 0 COMMENT '拒绝加入申请',
  -- 角色管理
  can_create_role TINYINT(1) DEFAULT 0 COMMENT '创建项目角色',
  can_edit_role_name TINYINT(1) DEFAULT 0 COMMENT '编辑角色名称',
  can_edit_role_color TINYINT(1) DEFAULT 0 COMMENT '编辑角色颜色',
  can_edit_role_perms TINYINT(1) DEFAULT 0 COMMENT '编辑角色权限',
  can_delete_role TINYINT(1) DEFAULT 0 COMMENT '删除角色',
  -- 任务创建
  can_create_task TINYINT(1) DEFAULT 0 COMMENT '创建任务',
  can_create_task_with_attachment TINYINT(1) DEFAULT 0 COMMENT '创建任务时上传附件',
  -- 任务删除与恢复
  can_delete_task TINYINT(1) DEFAULT 0 COMMENT '删除任务',
  can_view_task_trash TINYINT(1) DEFAULT 0 COMMENT '查看任务回收站',
  can_restore_task TINYINT(1) DEFAULT 0 COMMENT '恢复已删除任务',
  -- 任务状态流转
  can_move_task_accept TINYINT(1) DEFAULT 0 COMMENT '接受任务',
  can_move_task_dispute TINYINT(1) DEFAULT 0 COMMENT '提疑问',
  can_move_task_supplement TINYINT(1) DEFAULT 0 COMMENT '补充回复',
  can_move_task_submit_review TINYINT(1) DEFAULT 0 COMMENT '提交验收',
  can_move_task_reject TINYINT(1) DEFAULT 0 COMMENT '驳回验收',
  can_move_task_approve TINYINT(1) DEFAULT 0 COMMENT '验收通过',
  can_move_task_resubmit TINYINT(1) DEFAULT 0 COMMENT '重新验收',
  -- 任务编辑
  can_edit_task_title TINYINT(1) DEFAULT 0 COMMENT '编辑任务标题',
  can_edit_task_desc TINYINT(1) DEFAULT 0 COMMENT '编辑任务描述',
  can_edit_task_priority TINYINT(1) DEFAULT 0 COMMENT '编辑任务优先级',
  can_edit_task_deadline TINYINT(1) DEFAULT 0 COMMENT '编辑任务截止日期',
  can_assign_task TINYINT(1) DEFAULT 0 COMMENT '指派/变更负责人',
  -- 任务附件
  can_upload_task_attachment TINYINT(1) DEFAULT 0 COMMENT '上传任务附件',
  can_delete_task_attachment TINYINT(1) DEFAULT 0 COMMENT '删除任务附件',
  -- 审核要点
  can_add_review_point TINYINT(1) DEFAULT 0 COMMENT '添加审核要点',
  can_respond_review_point TINYINT(1) DEFAULT 0 COMMENT '回复审核要点',
  can_confirm_review_point TINYINT(1) DEFAULT 0 COMMENT '确认审核要点',
  -- 任务预设标题
  can_view_title_options TINYINT(1) DEFAULT 0 COMMENT '查看标题选项',
  can_record_title_history TINYINT(1) DEFAULT 0 COMMENT '记录历史标题',
  can_delete_title_history TINYINT(1) DEFAULT 0 COMMENT '删除历史标题',
  can_edit_title_presets TINYINT(1) DEFAULT 0 COMMENT '编辑预设模板',
  -- 里程碑
  can_create_milestone TINYINT(1) DEFAULT 0 COMMENT '创建里程碑',
  can_edit_milestone TINYINT(1) DEFAULT 0 COMMENT '编辑里程碑',
  can_delete_milestone TINYINT(1) DEFAULT 0 COMMENT '删除里程碑',
  can_toggle_milestone TINYINT(1) DEFAULT 0 COMMENT '切换里程碑完成状态',
  -- 报表
  can_view_report TINYINT(1) DEFAULT 0 COMMENT '查看报表',
  can_export_data TINYINT(1) DEFAULT 0 COMMENT '导出项目数据',
  -- 应用/集成
  can_manage_app_config TINYINT(1) DEFAULT 0 COMMENT '管理应用配置',
  can_manage_app_integration TINYINT(1) DEFAULT 0 COMMENT '管理集成设置',
  -- 元数据
  color VARCHAR(20) DEFAULT '#64748b',
  sort_order INT DEFAULT 0,
  is_default TINYINT(1) DEFAULT 0,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project (project_id)
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
