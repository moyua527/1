import paramiko, json
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Find site config
stdin, stdout, stderr = ssh.exec_command("ls /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null")
print("Files:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command("cat /etc/nginx/sites-enabled/default 2>/dev/null || cat /etc/nginx/sites-enabled/duijie 2>/dev/null")
print("--- Site Config ---")
print(stdout.read().decode()[:2000])

# Test API through Nginx with verbose headers
import time
time.sleep(2)  # wait for rate limit
stdin, stdout, stderr = ssh.exec_command("""curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"15911111111","password":"123456"}'""")
print("\nLogin status code:", stdout.read().decode())

time.sleep(2)
# Login directly on backend port
stdin, stdout, stderr = ssh.exec_command("""curl -s http://localhost:1800/api/auth/login -H 'Content-Type: application/json' -d '{"username":"15911111111","password":"123456"}'""")
login_data = stdout.read().decode()
login_res = json.loads(login_data)
token = login_res.get('token', '')

# Test projects through Nginx
stdin, stdout, stderr = ssh.exec_command(f"""curl -sv http://localhost:8080/api/projects -H 'Authorization: Bearer {token}' 2>&1""")
print("\n--- Projects via Nginx ---")
print(stdout.read().decode()[:1000])

ssh.close()
