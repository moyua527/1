import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
transport = ssh.get_transport()
if transport:
    transport.set_keepalive(15)

stdin, stdout, stderr = ssh.exec_command('cat /opt/duijie/server/duijie/.env')
env_out = stdout.read().decode()
db_pass = ''
for line in env_out.split('\n'):
    if line.startswith('DB_PASSWORD='):
        db_pass = line.split('=', 1)[1].strip()
        break

cmd = f"""mysql -u duijie -p'{db_pass}' duijie_db -e "SELECT id, username, LEFT(password,15) as pwd_start, LENGTH(password) as pwd_len, is_active, created_at FROM voice_users WHERE username='moyua527';" """
stdin, stdout, stderr = ssh.exec_command(cmd)
exit_code = stdout.channel.recv_exit_status()
print(stdout.read().decode())

ssh.close()
