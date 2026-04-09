import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))

# Check PM2 logs for errors
i,o,e = ssh.exec_command('pm2 logs duijie --lines 30 --nostream')
print('=== PM2 Logs (last 30) ===')
print(o.read().decode()[-2000:])

# Test bundle info
i,o,e = ssh.exec_command('curl -s http://localhost:1800/api/app/bundle')
print('\n=== Bundle Info ===')
print(o.read().decode())

# Test bundle download - check if zip is valid
i,o,e = ssh.exec_command('curl -s -o /tmp/test.zip http://localhost:1800/api/app/bundle/download && unzip -l /tmp/test.zip | head -20')
print('\n=== ZIP Contents ===')
print(o.read().decode())
err = e.read().decode()
if err: print('ERR:', err)

# Check if file is accessible from external IP
i,o,e = ssh.exec_command('curl -sI -H "User-Agent: DuiJie" http://160.202.253.143:8080/api/app/bundle/download')
print('\n=== External access ===')
print(o.read().decode())

ssh.close()
