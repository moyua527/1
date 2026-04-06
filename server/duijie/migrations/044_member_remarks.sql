-- 044: 项目成员备注（仅备注者自己可见）
ALTER TABLE duijie_project_members ADD COLUMN remarks JSON DEFAULT NULL COMMENT '对其他成员的备注 {userId: remark}' AFTER nickname;
