-- 审计日志表优化：添加索引 + 归档表
-- 重复索引会被迁移脚本自动跳过 (ER_DUP_KEYNAME)

CREATE INDEX idx_audit_logs_created_at ON duijie_audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_action ON duijie_audit_logs(user_id, action, created_at);
CREATE INDEX idx_audit_logs_entity ON duijie_audit_logs(entity_type, entity_id, created_at);

-- 创建审计日志归档表
CREATE TABLE IF NOT EXISTS duijie_audit_logs_archive LIKE duijie_audit_logs;
