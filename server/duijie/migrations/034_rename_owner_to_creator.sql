-- 将已有项目中 role_key='owner' 的角色名从"负责人"改为"创建者"，颜色改为红色
UPDATE project_roles SET name = '创建者', color = '#dc2626' WHERE role_key = 'owner' AND is_deleted = 0;
