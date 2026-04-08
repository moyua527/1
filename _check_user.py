import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
transport = ssh.get_transport()
if transport:
    transport.set_keepalive(15)

stdin, stdout, stderr = ssh.exec_command("""mysql -u duijie -pDuijie@2024 duijie_db -e "SELECT id, username, display_id, phone, LEFT(password, 10) as pwd_prefix, is_active, is_deleted FROM voice_users WHERE username LIKE '%31242%' OR phone LIKE '%31242%' OR display_id LIKE '%31242%' LIMIT 5;" """)
exit_code = stdout.channel.recv_exit_status()
print(stdout.read().decode())
err = stderr.read().decode()
if 'ERROR' in err:
    print('Error:', err)

ssh.close()
