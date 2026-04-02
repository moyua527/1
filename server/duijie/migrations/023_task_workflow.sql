-- 023: 任务工作流改造 - 添加审核流程
-- 新状态: submitted(已提出), disputed(待补充), review_failed(验收不通过)
-- 新表: duijie_task_review_points (审核要点)

-- 1. 扩展任务状态枚举
ALTER TABLE duijie_tasks MODIFY COLUMN status
  ENUM('todo','submitted','disputed','in_progress','pending_review','review_failed','accepted')
  DEFAULT 'submitted';

-- 2. 将现有 todo 状态迁移为 submitted
UPDATE duijie_tasks SET status = 'submitted' WHERE status = 'todo';

-- 3. 创建任务审核要点表
CREATE TABLE IF NOT EXISTS duijie_task_review_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  round_type ENUM('initial', 'acceptance') NOT NULL COMMENT '初审/验收',
  author_id INT NOT NULL COMMENT '提出人',
  content TEXT NOT NULL COMMENT '要点内容',
  response TEXT COMMENT '回复内容',
  response_by INT COMMENT '回复人',
  response_at TIMESTAMP NULL COMMENT '回复时间',
  status ENUM('pending', 'answered', 'confirmed') DEFAULT 'pending' COMMENT '待回答/已回答/已确认',
  confirmed_at TIMESTAMP NULL COMMENT '确认时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trp_task (task_id),
  INDEX idx_trp_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务审核要点';
