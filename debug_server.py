import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check what files are in dist/assets
stdin, stdout, stderr = ssh.exec_command("ls -la /opt/duijie/frontend/duijieReact/dist/assets/")
print("--- Server dist/assets ---")
print(stdout.read().decode())

# Check index.html to see which JS file it references
stdin, stdout, stderr = ssh.exec_command("cat /opt/duijie/frontend/duijieReact/dist/index.html")
print("--- index.html ---")
print(stdout.read().decode())

# Check PM2 logs for any errors
stdin, stdout, stderr = ssh.exec_command("pm2 logs duijie --lines 20 --nostream 2>&1")
print("--- PM2 Logs ---")
print(stdout.read().decode()[:1500])

ssh.close()
