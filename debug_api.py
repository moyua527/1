import paramiko, json
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Login as user 15911111111 to get token
login_cmd = """curl -s http://localhost:1800/api/auth/login -H 'Content-Type: application/json' -d '{"username":"15911111111","password":"123456"}'"""
stdin, stdout, stderr = ssh.exec_command(login_cmd)
login_res = json.loads(stdout.read().decode())
print("Login:", json.dumps(login_res, indent=2, ensure_ascii=False)[:300])

if login_res.get('success') and login_res.get('token'):
    token = login_res['token']
    # Test project list
    cmd = f"""curl -s http://localhost:1800/api/projects -H 'Authorization: Bearer {token}'"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    res = stdout.read().decode()
    print("\nProjects:", res[:500])
    
    # Test dashboard stats
    cmd2 = f"""curl -s http://localhost:1800/api/dashboard/stats -H 'Authorization: Bearer {token}'"""
    stdin, stdout, stderr = ssh.exec_command(cmd2)
    res2 = stdout.read().decode()
    print("\nDashboard:", res2[:500])
else:
    print("Login failed, trying with other password")
    login_cmd2 = """curl -s http://localhost:1800/api/auth/login -H 'Content-Type: application/json' -d '{"username":"15911111111","password":"15911111111"}'"""
    stdin, stdout, stderr = ssh.exec_command(login_cmd2)
    res = stdout.read().decode()
    print("Login2:", res[:300])

ssh.close()
