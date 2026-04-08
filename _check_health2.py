import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
transport = ssh.get_transport()
if transport:
    transport.set_keepalive(15)

stdin, stdout, stderr = ssh.exec_command('pm2 status && curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/app/version && echo "" && pm2 logs duijie --lines 30 --nostream 2>&1')
exit_code = stdout.channel.recv_exit_status()
print(stdout.read().decode()[:2000])
print(stderr.read().decode()[:500])

ssh.close()
