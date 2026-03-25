-- 支持用户加入多个企业：记录当前活跃企业ID
ALTER TABLE voice_users ADD COLUMN active_enterprise_id INT DEFAULT NULL COMMENT '当前活跃企业ID';
