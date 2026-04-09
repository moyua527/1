import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
cmd = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "SELECT id, username, LEFT(password, 10) as pw_prefix, LENGTH(password) as pw_len FROM voice_users LIMIT 10" """
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
if out: print(out)
if err and 'Warning' not in err: print(f'[ERR] {err}')
ssh.close()
