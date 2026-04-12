import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS',''))
stdin, stdout, stderr = ssh.exec_command('pm2 logs duijie --lines 30 --nostream')
print(stdout.read().decode()[-2000:])
print(stderr.read().decode()[-2000:])
ssh.close()
