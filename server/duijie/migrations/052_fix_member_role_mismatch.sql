-- 修复 addMemberController 导致的成员 project_role_id 与 legacy role 不匹配问题
-- 场景：成员 role='editor' 但 project_role_id 指向 'viewer' 的默认角色
UPDATE duijie_project_members pm
INNER JOIN project_roles pr_current
  ON pr_current.id = pm.project_role_id AND pr_current.is_deleted = 0
INNER JOIN project_roles pr_correct
  ON pr_correct.project_id = pm.project_id
  AND pr_correct.role_key = pm.role
  AND pr_correct.is_deleted = 0
SET pm.project_role_id = pr_correct.id
WHERE pr_current.role_key != pm.role
  AND pr_current.role_key IS NOT NULL
  AND pm.role IN ('owner', 'editor', 'viewer');
