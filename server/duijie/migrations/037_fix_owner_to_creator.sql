-- 1) 将残留的"负责人"角色名统一改为"创建者"
UPDATE project_roles SET name = '创建者', color = '#dc2626'
WHERE role_key = 'owner' AND name != '创建者' AND is_deleted = 0;

-- 2) 确保所有 role='owner' 的成员都分配了创建者的 project_role_id
UPDATE duijie_project_members pm
JOIN project_roles pr ON pr.project_id = pm.project_id AND pr.role_key = 'owner' AND pr.is_deleted = 0
SET pm.project_role_id = pr.id
WHERE pm.role = 'owner' AND (pm.project_role_id IS NULL OR pm.project_role_id != pr.id);
