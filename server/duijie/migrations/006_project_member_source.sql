-- 项目成员区分来源：internal=我方团队 / client=客户企业
ALTER TABLE duijie_project_members ADD COLUMN source VARCHAR(20) DEFAULT 'internal' COMMENT 'internal=我方/client=客户方';
