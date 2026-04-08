import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
i, o, e = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/app/version')
print('Health:', o.read().decode())
ssh.close()
