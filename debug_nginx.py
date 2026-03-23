import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check nginx config for caching
stdin, stdout, stderr = ssh.exec_command("cat /etc/nginx/sites-enabled/duijie.conf 2>/dev/null || cat /etc/nginx/conf.d/duijie.conf 2>/dev/null || cat /etc/nginx/nginx.conf")
print("--- Nginx Config ---")
print(stdout.read().decode()[:3000])

# Also test the API through Nginx (port 8080)
import json
login_cmd = """curl -s http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"15911111111","password":"123456"}'"""
stdin, stdout, stderr = ssh.exec_command(login_cmd)
login_res = json.loads(stdout.read().decode())
token = login_res.get('token', '')
if token:
    cmd = f"""curl -s http://localhost:8080/api/projects -H 'Authorization: Bearer {token}'"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("\n--- Projects via Nginx (8080) ---")
    print(stdout.read().decode()[:500])

ssh.close()
