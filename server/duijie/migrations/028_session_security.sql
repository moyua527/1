-- 028_session_security.sql
-- 为 refresh_tokens 表添加设备信息字段，支持会话管理

ALTER TABLE refresh_tokens ADD COLUMN user_agent VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA';
ALTER TABLE refresh_tokens ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL COMMENT '登录IP';
ALTER TABLE refresh_tokens ADD COLUMN device_name VARCHAR(100) DEFAULT NULL COMMENT '设备名称(解析自UA)';
