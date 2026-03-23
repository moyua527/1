import paramiko, json, time
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Flush logs first
ssh.exec_command("pm2 flush duijie")
time.sleep(2)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

# Login via Nginx
stdin, stdout, stderr = ssh.exec_command(f"""curl -s -A '{UA}' http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{{"username":"15911111111","password":"123456"}}'""")
login = json.loads(stdout.read().decode())
token = login.get('token', '')
print("Login OK, userId:", login.get('data', {}).get('id'))

time.sleep(1)

# Call projects API through Nginx (like the browser would)
stdin, stdout, stderr = ssh.exec_command(f"""curl -s -A '{UA}' 'http://localhost:8080/api/projects?_t=999' -H 'Authorization: Bearer {token}'""")
resp = stdout.read().decode()
print("Projects response:", resp[:200])

time.sleep(2)

# Now read the PM2 logs
stdin, stdout, stderr = ssh.exec_command("pm2 logs duijie --lines 30 --nostream 2>&1")
print("\n--- PM2 Logs ---")
print(stdout.read().decode())

ssh.close()
