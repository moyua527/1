import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
cmds = [
    "SELECT id, name, client_id, created_by, status FROM duijie_projects WHERE is_deleted=0",
    "SELECT * FROM duijie_project_members",
    "SELECT id, user_id, client_type, name FROM duijie_clients WHERE is_deleted=0",
]
for c in cmds:
    stdin, stdout, stderr = ssh.exec_command(f"mysql -u duijie -p'DuiJie@2024!' duijie_db -e \"{c}\"")
    print(f"\n--- {c[:60]} ---")
    print(stdout.read().decode())
ssh.close()
