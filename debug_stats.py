import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

queries = [
    "SELECT id, username, role FROM duijie_users WHERE is_deleted=0",
    "SELECT id, project_id, title, status, assignee_id FROM duijie_tasks WHERE is_deleted=0",
    "SELECT project_id, user_id, role FROM duijie_project_members",
    "SELECT id, name, created_by FROM duijie_projects WHERE is_deleted=0",
]

for q in queries:
    cmd = f"""mysql -u duijie -p'DuiJie@2024!' duijie_db -e "{q}" """
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(f'\n=== {q[:60]}... ===')
    print(stdout.read().decode())

ssh.close()
