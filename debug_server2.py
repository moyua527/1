import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check actual standalone.js on server
stdin, stdout, stderr = ssh.exec_command("head -20 /opt/duijie/server/duijie/standalone.js")
print("--- standalone.js (first 20 lines) ---")
print(stdout.read().decode())

# Check express-rate-limit version
stdin, stdout, stderr = ssh.exec_command("cat /opt/duijie/server/duijie/node_modules/express-rate-limit/package.json | grep version")
print("--- express-rate-limit version ---")
print(stdout.read().decode())

# Check PM2 logs with timestamps
stdin, stdout, stderr = ssh.exec_command("pm2 logs duijie --lines 30 --nostream --format 2>&1")
print("--- PM2 Logs (formatted) ---")
print(stdout.read().decode()[:2000])

# Check if antiBot middleware exists and what it does
stdin, stdout, stderr = ssh.exec_command("cat /opt/duijie/server/duijie/atomic/middleware/antiBot.js 2>/dev/null")
print("--- antiBot middleware ---")
print(stdout.read().decode()[:500])

ssh.close()
