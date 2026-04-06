import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

cmds = [
    "mysql -u duijie -p'DuiJie@2024!' duijie_db -e \"SELECT id, type, content, link, project_id FROM duijie_notifications WHERE type IN ('task_assigned','task_status') LIMIT 10\"",
    "mysql -u duijie -p'DuiJie@2024!' duijie_db -e \"SELECT id, title, project_id FROM duijie_tasks LIMIT 5\"",
]
for cmd in cmds:
    _, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if 'Warning' not in err and err:
        print(f"STDERR: {err}")
    print('---')

ssh.close()
