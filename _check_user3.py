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

cmd = f"""mysql -u duijie -p'{db_pass}' duijie_db -e "SELECT id, username, display_id, phone, LEFT(password,10) as pwd_prefix, is_active, is_deleted FROM voice_users WHERE username LIKE '%31242%' OR phone LIKE '%31242%' OR display_id LIKE '%31242%';" """
stdin, stdout, stderr = ssh.exec_command(cmd)
exit_code = stdout.channel.recv_exit_status()
out = stdout.read().decode()
print('Search result:', out if out.strip() else '(no match)')

cmd2 = f"""mysql -u duijie -p'{db_pass}' duijie_db -e "SELECT id, username, display_id, phone FROM voice_users WHERE is_deleted=0 AND is_active=1;" """
stdin, stdout, stderr = ssh.exec_command(cmd2)
exit_code = stdout.channel.recv_exit_status()
print('All active users:')
print(stdout.read().decode())

ssh.close()
