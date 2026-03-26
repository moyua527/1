-- 通知表增加分类字段，支持按类型筛选和分组显示
ALTER TABLE duijie_notifications
  ADD COLUMN category VARCHAR(30) DEFAULT 'system' COMMENT '分类: project/task/approval/system';

-- 根据已有type字段回填category
UPDATE duijie_notifications SET category = 'project' WHERE type IN ('project_member');
UPDATE duijie_notifications SET category = 'task' WHERE type IN ('task_assigned', 'task_status');
UPDATE duijie_notifications SET category = 'approval' WHERE type IN ('ticket_reply', 'follow_reminder');

-- 添加索引优化按分类查询
ALTER TABLE duijie_notifications ADD INDEX idx_user_category (user_id, category);
