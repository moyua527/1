ALTER TABLE duijie_clients ADD COLUMN join_code VARCHAR(20) NULL AFTER stage;

UPDATE duijie_clients
SET join_code = UPPER(SUBSTRING(SHA2(CONCAT(id, '-', IFNULL(user_id, 0), '-', UNIX_TIMESTAMP(IFNULL(created_at, NOW())), '-', RAND()), 256), 1, 10))
WHERE client_type = 'company' AND is_deleted = 0 AND (join_code IS NULL OR join_code = '');

CREATE UNIQUE INDEX idx_duijie_clients_join_code ON duijie_clients (join_code);
