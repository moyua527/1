import paramiko, json, time
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
ssh.exec_command("pm2 flush duijie")
time.sleep(2)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

# Login as user 10 (role=client in old JWT, role=member in fresh login)
stdin, stdout, stderr = ssh.exec_command(f"""curl -s -A '{UA}' http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{{"username":"15911111111","password":"123456"}}'""")
login = json.loads(stdout.read().decode())
token = login.get('token', '')
print("Login role:", login.get('data', {}).get('role'))

time.sleep(1)
# Test projects through Nginx
stdin, stdout, stderr = ssh.exec_command(f"""curl -s -A '{UA}' 'http://localhost:8080/api/projects?_t=test' -H 'Authorization: Bearer {token}'""")
resp = json.loads(stdout.read().decode())
print("Projects success:", resp.get('success'), "total:", resp.get('data', {}).get('total'))

time.sleep(2)
# Check PM2 logs
stdin, stdout, stderr = ssh.exec_command("pm2 logs duijie --lines 15 --nostream 2>&1")
print("\n--- PM2 Logs ---")
print(stdout.read().decode())

ssh.close()
