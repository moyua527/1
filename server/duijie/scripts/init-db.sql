-- DuiJie 模块数据库初始化
-- 在 voice_room_db 中创建 duijie_ 前缀表

CREATE TABLE IF NOT EXISTS duijie_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '客户名称',
  company VARCHAR(200) COMMENT '公司名称',
  email VARCHAR(200) COMMENT '邮箱',
  phone VARCHAR(50) COMMENT '电话',
  channel VARCHAR(100) COMMENT '渠道来源',
  stage VARCHAR(20) DEFAULT 'potential' COMMENT '客户阶段: potential/intent/signed/active/lost',
  position_level VARCHAR(50) COMMENT '职位级别',
  department VARCHAR(100) COMMENT '部门',
  job_function VARCHAR(100) COMMENT '工作职能',
  avatar VARCHAR(500) COMMENT '头像URL',
  notes TEXT COMMENT '备注',
  assigned_to INT COMMENT '对接人(负责业务员)',
  created_by INT NOT NULL COMMENT '创建者',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_created_by (created_by),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-客户表';

CREATE TABLE IF NOT EXISTS duijie_opportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '商机标题',
  client_id INT COMMENT '关联客户',
  amount DECIMAL(12,2) DEFAULT 0 COMMENT '预计金额',
  probability TINYINT DEFAULT 50 COMMENT '成交概率%',
  stage VARCHAR(20) DEFAULT 'lead' COMMENT '商机阶段: lead/qualify/proposal/negotiate/won/lost',
  expected_close DATE COMMENT '预计成交日期',
  assigned_to INT COMMENT '负责人',
  notes TEXT COMMENT '备注',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_stage (stage),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-商机表';

CREATE TABLE IF NOT EXISTS duijie_direct_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL COMMENT '发送者',
  receiver_id INT NOT NULL COMMENT '接收者',
  content TEXT NOT NULL COMMENT '消息内容',
  read_at TIMESTAMP NULL COMMENT '已读时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-站内消息表';

CREATE TABLE IF NOT EXISTS duijie_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '工单标题',
  content TEXT COMMENT '工单内容',
  type ENUM('requirement','bug','question','other') DEFAULT 'question' COMMENT '类型',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium' COMMENT '优先级',
  status ENUM('open','processing','resolved','closed') DEFAULT 'open' COMMENT '状态',
  project_id INT COMMENT '关联项目',
  created_by INT NOT NULL COMMENT '提交者',
  assigned_to INT COMMENT '处理人',
  resolved_at TIMESTAMP NULL COMMENT '解决时间',
  rating TINYINT NULL COMMENT '满意度评分1-5',
  rating_comment TEXT COMMENT '评价内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_created_by (created_by),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_status (status),
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-工单表';

CREATE TABLE IF NOT EXISTS duijie_ticket_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL COMMENT '关联工单',
  content TEXT NOT NULL COMMENT '回复内容',
  created_by INT NOT NULL COMMENT '回复者',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-工单回复表';

CREATE TABLE IF NOT EXISTS duijie_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL COMMENT '项目名称',
  description TEXT COMMENT '项目描述',
  client_id INT NOT NULL COMMENT '关联客户',
  status ENUM('planning','in_progress','review','completed','on_hold') DEFAULT 'planning' COMMENT '状态',
  progress TINYINT DEFAULT 0 COMMENT '进度百分比',
  start_date DATE COMMENT '开始日期',
  end_date DATE COMMENT '结束日期',
  budget DECIMAL(12,2) DEFAULT 0 COMMENT '预算',
  tags VARCHAR(500) COMMENT '标签JSON',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-项目表';

CREATE TABLE IF NOT EXISTS duijie_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  title VARCHAR(200) NOT NULL COMMENT '任务标题',
  description TEXT COMMENT '任务描述',
  status ENUM('todo','in_progress','done') DEFAULT 'todo' COMMENT '状态',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium' COMMENT '优先级',
  assignee_id INT COMMENT '负责人',
  due_date DATE COMMENT '截止日期',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_assignee_id (assignee_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-任务表';

CREATE TABLE IF NOT EXISTS duijie_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  title VARCHAR(200) NOT NULL COMMENT '里程碑标题',
  description TEXT COMMENT '描述',
  due_date DATE COMMENT '目标日期',
  is_completed TINYINT(1) DEFAULT 0 COMMENT '是否完成',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-里程碑表';

CREATE TABLE IF NOT EXISTS duijie_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  name VARCHAR(300) NOT NULL COMMENT '文件名',
  original_name VARCHAR(300) COMMENT '原始文件名',
  size BIGINT DEFAULT 0 COMMENT '文件大小bytes',
  mime_type VARCHAR(100) COMMENT 'MIME类型',
  path VARCHAR(500) NOT NULL COMMENT '存储路径',
  version INT DEFAULT 1 COMMENT '版本号',
  uploaded_by INT NOT NULL COMMENT '上传者',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-文件表';

CREATE TABLE IF NOT EXISTS duijie_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '关联项目',
  sender_id INT NOT NULL COMMENT '发送者',
  content TEXT NOT NULL COMMENT '消息内容',
  type ENUM('text','file','system') DEFAULT 'text' COMMENT '消息类型',
  is_client_visible TINYINT(1) DEFAULT 1 COMMENT '客户是否可见',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_project_id (project_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接-消息表';
