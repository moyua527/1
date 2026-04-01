-- 乐观锁: 核心表添加 version 字段用于并发控制
ALTER TABLE duijie_tasks ADD COLUMN version INT NOT NULL DEFAULT 0;
ALTER TABLE duijie_projects ADD COLUMN version INT NOT NULL DEFAULT 0;
ALTER TABLE duijie_clients ADD COLUMN version INT NOT NULL DEFAULT 0;
ALTER TABLE duijie_tickets ADD COLUMN version INT NOT NULL DEFAULT 0;
