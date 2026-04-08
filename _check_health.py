import paramiko, os, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))

time.sleep(3)

stdin, stdout, stderr = ssh.exec_command('pm2 status')
print(stdout.read().decode()[:600])

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/app/version')
print('Health:', stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('pm2 logs duijie --lines 20 --nostream')
print('Logs:')
print(stdout.read().decode()[:1000])
print(stderr.read().decode()[:1000])

ssh.close()
