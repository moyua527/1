import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Find a member user to test with
cmd = """mysql -u duijie -p'DuiJie@2024!' duijie_db -N -e "SELECT id, username, role FROM duijie_users WHERE role='member' AND is_deleted=0 LIMIT 1" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print('Member user:', stdout.read().decode().strip())

# Test the stats query directly with member filtering
cmd2 = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "
SELECT COUNT(*) as total,
  SUM(t.status = 'todo') as pending,
  SUM(t.status = 'done') as done
FROM duijie_tasks t
WHERE t.is_deleted = 0
AND (t.assignee_id = 4 OR t.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = 4) OR t.project_id IN (SELECT id FROM duijie_projects WHERE created_by = 4))
" """
stdin, stdout, stderr = ssh.exec_command(cmd2)
print('Stats for user 4:', stdout.read().decode())

ssh.close()
