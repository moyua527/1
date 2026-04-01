import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Get projects with enterprise names
cmd = """mysql -u root -p'Xiao134679' duijie_db -e "
SELECT p.id, p.name as project_name,
       p.internal_client_id, ic.name as internal_name,
       p.client_id, c.name as client_name,
       p.status, p.created_by,
       CASE WHEN p.internal_client_id = p.client_id THEN 'SAME' 
            WHEN p.internal_client_id IS NULL THEN 'NO_INTERNAL'
            WHEN p.client_id IS NULL THEN 'NO_CLIENT'
            ELSE 'OK' END as integrity
FROM duijie_projects p
LEFT JOIN duijie_clients ic ON p.internal_client_id = ic.id
LEFT JOIN duijie_clients c ON p.client_id = c.id
WHERE p.is_deleted = 0 ORDER BY p.id"
"""
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
err = stderr.read().decode()
if err and 'Warning' not in err:
    print(err)
ssh.close()
