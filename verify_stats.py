import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check if server file has the assignee_id fix
stdin, stdout, stderr = ssh.exec_command('grep -n "assignee_id" /opt/duijie/server/duijie/atomic/repositories/dashboard/statsRepo.js')
out = stdout.read().decode()
print('=== statsRepo.js assignee_id lines ===')
print(out if out else '(NOT FOUND - file not updated!)')

# Also check chartController
stdin, stdout, stderr = ssh.exec_command('grep -n "assignee_id" /opt/duijie/server/duijie/atomic/controllers/dashboard/chartController.js')
out2 = stdout.read().decode()
print('=== chartController.js assignee_id lines ===')
print(out2 if out2 else '(NOT FOUND)')

# Check PM2 status
stdin, stdout, stderr = ssh.exec_command('pm2 show duijie | grep -E "status|uptime|restarts"')
print('=== PM2 status ===')
print(stdout.read().decode())

ssh.close()
