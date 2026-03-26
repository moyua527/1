-- 用户表增加TOTP两步验证字段
ALTER TABLE voice_users
  ADD COLUMN totp_secret VARCHAR(64) DEFAULT NULL COMMENT 'TOTP密钥(base32)',
  ADD COLUMN totp_enabled TINYINT(1) DEFAULT 0 COMMENT '是否启用2FA';
