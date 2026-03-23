import paramiko, json, time
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check PM2 error logs after restart
stdin, stdout, stderr = ssh.exec_command("pm2 flush duijie 2>&1; sleep 2; pm2 logs duijie --lines 5 --nostream 2>&1")
print("--- PM2 Logs (after flush) ---")
print(stdout.read().decode()[:500])

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

# Login and test projects through Nginx
stdin, stdout, stderr = ssh.exec_command(f"""curl -s -A '{UA}' http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{{"username":"15911111111","password":"123456"}}'""")
login = json.loads(stdout.read().decode())
token = login.get('token', '')

time.sleep(1)
stdin, stdout, stderr = ssh.exec_command(f"""curl -s -A '{UA}' 'http://localhost:8080/api/projects?_t=123' -H 'Authorization: Bearer {token}'""")
print("\n--- Projects via Nginx ---")
print(stdout.read().decode()[:300])

# Check if any new errors appeared
time.sleep(1)
stdin, stdout, stderr = ssh.exec_command("pm2 logs duijie --lines 5 --nostream 2>&1")
print("\n--- PM2 Logs (after test) ---")
print(stdout.read().decode()[:500])

ssh.close()
