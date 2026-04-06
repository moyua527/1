-- 通知表增加 project_id，支持按项目分组显示
ALTER TABLE duijie_notifications
  ADD COLUMN project_id INT NULL AFTER category;

ALTER TABLE duijie_notifications
  ADD INDEX idx_user_project (user_id, project_id);

-- 从 link 字段回填 project_id（link 格式: /projects/123 或 /projects/123?...）
UPDATE duijie_notifications
SET project_id = CAST(
  SUBSTRING_INDEX(SUBSTRING_INDEX(link, '/projects/', -1), '?', 1) AS UNSIGNED
)
WHERE link LIKE '/projects/%'
  AND project_id IS NULL;
