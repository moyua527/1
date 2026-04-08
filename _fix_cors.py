import paramiko, os, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
sftp = ssh.open_sftp()

sftp.put(r'e:\DuiJie\server\duijie\app.js', '/opt/duijie/server/duijie/app.js')
print('app.js uploaded')

stdin, stdout, stderr = ssh.exec_command('pm2 restart duijie')
print(stdout.read().decode()[:500])

time.sleep(2)

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/app/version')
print('Health:', stdout.read().decode())

sftp.close()
ssh.close()
