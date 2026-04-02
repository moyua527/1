import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

stdin, stdout, stderr = ssh.exec_command('pm2 restart duijie')
print(stdout.read().decode().strip()[:300])
ssh.close()
print('PM2 restarted - rate limit cleared')
