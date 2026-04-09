import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
cmds = [
    """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "SELECT status, COUNT(*) as cnt FROM duijie_projects WHERE is_deleted = 0 GROUP BY status" """,
    """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "SELECT status, COUNT(*) as cnt FROM duijie_tasks WHERE is_deleted = 0 GROUP BY status" """,
]
for cmd in cmds:
    print(f'\n=== query ===')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err and 'Warning' not in err and 'mysql:' not in err: print(f'[ERR] {err}')
ssh.close()
