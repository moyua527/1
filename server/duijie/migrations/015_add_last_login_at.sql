ALTER TABLE voice_users
  ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
