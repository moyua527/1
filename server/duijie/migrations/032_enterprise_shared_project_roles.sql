-- 032_enterprise_shared_project_roles.sql
-- 项目角色改为企业级共享：所有项目共用同一套项目角色

-- 1. 添加 enterprise_id 列
ALTER TABLE project_roles ADD COLUMN enterprise_id INT DEFAULT NULL AFTER project_id;
CREATE INDEX idx_enterprise ON project_roles (enterprise_id);

-- 2. 从已有角色推导 enterprise_id（通过 project → internal_client_id）
UPDATE project_roles pr
  JOIN duijie_projects p ON p.id = pr.project_id
  SET pr.enterprise_id = p.internal_client_id
  WHERE pr.enterprise_id IS NULL AND p.internal_client_id IS NOT NULL;

-- 3. project_id 设为可空（共享角色不再绑定单个项目）
ALTER TABLE project_roles MODIFY COLUMN project_id INT DEFAULT NULL;
