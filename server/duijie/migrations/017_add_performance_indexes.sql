-- 性能优化索引
-- duijie_clients: 搜索和筛选优化
ALTER TABLE duijie_clients ADD INDEX idx_name (name);
ALTER TABLE duijie_clients ADD INDEX idx_stage (stage);

-- duijie_contacts: 软删除查询优化
ALTER TABLE duijie_contacts ADD INDEX idx_is_deleted (is_deleted);

-- duijie_contracts: 按客户和状态查询
ALTER TABLE duijie_contracts ADD INDEX idx_client_status (client_id, status);

-- duijie_follow_ups: 按时间排序
ALTER TABLE duijie_follow_ups ADD INDEX idx_created_at (created_at);
ALTER TABLE duijie_follow_ups ADD INDEX idx_is_deleted (is_deleted);

-- duijie_messages: 按项目和时间查询
ALTER TABLE duijie_messages ADD INDEX idx_created_at (created_at);

-- voice_users: 登录查询优化
ALTER TABLE voice_users ADD INDEX idx_phone (phone);
ALTER TABLE voice_users ADD INDEX idx_email (email);
ALTER TABLE voice_users ADD INDEX idx_is_active (is_active);
