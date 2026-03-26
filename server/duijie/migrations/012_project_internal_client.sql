ALTER TABLE duijie_projects
ADD COLUMN internal_client_id INT DEFAULT NULL COMMENT '我方企业ID' AFTER client_id;

UPDATE duijie_projects p
LEFT JOIN voice_users u ON u.id = p.created_by
SET p.internal_client_id = u.active_enterprise_id
WHERE p.internal_client_id IS NULL;
