import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
transport = ssh.get_transport()
if transport:
    transport.set_keepalive(15)

# Read DB password from .env
stdin, stdout, stderr = ssh.exec_command('cat /opt/duijie/server/duijie/.env')
env_out = stdout.read().decode()
db_pass = ''
for line in env_out.split('\n'):
    if line.startswith('DB_PASSWORD='):
        db_pass = line.split('=', 1)[1].strip()
        break

print(f'DB password: {db_pass[:3]}...')

cmd = f"""mysql -u duijie -p'{db_pass}' duijie_db -e "SELECT id, username, display_id, phone, LEFT(password,10) as pwd_prefix, is_active, is_deleted FROM voice_users LIMIT 10;" """
stdin, stdout, stderr = ssh.exec_command(cmd)
exit_code = stdout.channel.recv_exit_status()
print(stdout.read().decode())
err = stderr.read().decode()
if err:
    print('Stderr:', err[:300])

ssh.close()
