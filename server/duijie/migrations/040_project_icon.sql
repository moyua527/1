ALTER TABLE duijie_projects ADD COLUMN icon VARCHAR(50) DEFAULT 'FolderKanban' AFTER description;
ALTER TABLE duijie_projects ADD COLUMN icon_color VARCHAR(20) DEFAULT '#3b82f6' AFTER icon;
