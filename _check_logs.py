import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', username='root', password='Xiao134679')

# Check deployed availableUsersController
stdin, stdout, stderr = c.exec_command("cat /opt/duijie/server/duijie/atomic/controllers/project/availableUsersController.js")
print("=== availableUsersController.js ===")
print(stdout.read().decode())

# Restart PM2 to pick up changes and check status
stdin, stdout, stderr = c.exec_command("cd /opt/duijie/server/duijie && pm2 restart duijie --update-env 2>&1 && sleep 2 && pm2 status 2>&1")
print("\n=== PM2 restart ===")
print(stdout.read().decode()[-1000:])

c.close()
