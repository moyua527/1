import paramiko, json
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# First login to get a token
login_cmd = """curl -s -X POST http://localhost:1800/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}'"""
_, out, _ = ssh.exec_command(login_cmd)
login_resp = out.read().decode()
print("LOGIN:", login_resp[:200])

try:
    login_data = json.loads(login_resp)
    token = login_data.get('token') or login_data.get('data', {}).get('accessToken', '')
except:
    token = ''

if not token:
    # Try another user
    login_cmd2 = """curl -s -X POST http://localhost:1800/api/auth/login -H 'Content-Type: application/json' -d '{"username":"xiao","password":"123456"}'"""
    _, out2, _ = ssh.exec_command(login_cmd2)
    login_resp2 = out2.read().decode()
    print("LOGIN2:", login_resp2[:200])
    try:
        login_data2 = json.loads(login_resp2)
        token = login_data2.get('token') or login_data2.get('data', {}).get('accessToken', '')
    except:
        token = ''

print("TOKEN:", token[:50] if token else "NONE")

# Test messages API for milestone 13
if token:
    msg_cmd = f"""curl -s http://localhost:1800/api/milestones/13/messages -H 'Cookie: accessToken={token}'"""
    _, out3, _ = ssh.exec_command(msg_cmd)
    msg_resp = out3.read().decode()
    print("MESSAGES(13):", msg_resp[:500])

    # Also test milestone 14
    msg_cmd2 = f"""curl -s http://localhost:1800/api/milestones/14/messages -H 'Cookie: accessToken={token}'"""
    _, out4, _ = ssh.exec_command(msg_cmd2)
    msg_resp2 = out4.read().decode()
    print("MESSAGES(14):", msg_resp2[:500])

ssh.close()
