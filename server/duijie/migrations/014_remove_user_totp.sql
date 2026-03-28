ALTER TABLE voice_users
  DROP COLUMN totp_secret,
  DROP COLUMN totp_enabled;
