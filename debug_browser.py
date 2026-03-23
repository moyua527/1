import paramiko, json, time
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

# Login via Nginx with browser UA
login_cmd = f"""curl -s -A '{UA}' http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{{"username":"15911111111","password":"123456"}}'"""
stdin, stdout, stderr = ssh.exec_command(login_cmd)
raw = stdout.read().decode()
print("Login response:", raw[:300])
login_res = json.loads(raw)
token = login_res.get('token', '')

if token:
    time.sleep(1)
    # Projects via Nginx with browser UA
    cmd = f"""curl -s -A '{UA}' http://localhost:8080/api/projects -H 'Authorization: Bearer {token}'"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    raw2 = stdout.read().decode()
    print("\nProjects response:", raw2[:500])
    
    # Also test /api/dashboard/stats
    time.sleep(1)
    cmd2 = f"""curl -s -A '{UA}' http://localhost:8080/api/dashboard/stats -H 'Authorization: Bearer {token}'"""
    stdin, stdout, stderr = ssh.exec_command(cmd2)
    raw3 = stdout.read().decode()
    print("\nDashboard response:", raw3[:300])
else:
    print("No token!")

ssh.close()
