-- 026: 项目邀请 - 添加 invited_by 字段到加入申请表
ALTER TABLE duijie_project_join_requests ADD COLUMN IF NOT EXISTS invited_by INT DEFAULT NULL AFTER user_id;
ALTER TABLE duijie_project_join_requests ADD COLUMN IF NOT EXISTS invite_type ENUM('self','member') DEFAULT 'self' AFTER invited_by;
