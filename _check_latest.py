import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
transport = ssh.get_transport()
if transport:
    transport.set_keepalive(15)

# Check latest PM2 logs for any CORS or login errors
stdin, stdout, stderr = ssh.exec_command('pm2 logs duijie --lines 30 --nostream 2>&1')
exit_code = stdout.channel.recv_exit_status()
print('=== PM2 Logs ===')
print(stdout.read().decode()[:3000])

# Check Nginx access log for recent requests
stdin, stdout, stderr = ssh.exec_command('tail -20 /var/log/nginx/access.log 2>/dev/null || echo "no nginx log"')
exit_code = stdout.channel.recv_exit_status()
print('\n=== Nginx Access Log ===')
print(stdout.read().decode()[:2000])

# Check Nginx error log
stdin, stdout, stderr = ssh.exec_command('tail -10 /var/log/nginx/error.log 2>/dev/null || echo "no nginx error log"')
exit_code = stdout.channel.recv_exit_status()
print('\n=== Nginx Error Log ===')
print(stdout.read().decode()[:1000])

ssh.close()
