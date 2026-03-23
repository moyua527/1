import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check Nginx access logs for /api/projects requests
stdin, stdout, stderr = ssh.exec_command("grep '/api/projects' /var/log/nginx/access.log | tail -20")
print("--- Nginx access logs for /api/projects ---")
print(stdout.read().decode())

# Check if there are old dist files
stdin, stdout, stderr = ssh.exec_command("ls -la /opt/duijie/frontend/duijieReact/dist/assets/")
print("--- dist/assets files ---")
print(stdout.read().decode())

# Check what the actual index.html serves
stdin, stdout, stderr = ssh.exec_command("cat /opt/duijie/frontend/duijieReact/dist/index.html | grep 'script'")
print("--- index.html script refs ---")
print(stdout.read().decode())

# Check PM2 recent logs for real user requests (not our curl test)
stdin, stdout, stderr = ssh.exec_command("pm2 logs duijie --lines 50 --nostream 2>&1 | grep -E '(auth|project/list|findAllRepo)' | tail -20")
print("--- Backend logs (auth + project) ---")
print(stdout.read().decode())

ssh.close()
