import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
transport = ssh.get_transport()
if transport:
    transport.set_keepalive(15)

# Verify CORS whitelist on server
stdin, stdout, stderr = ssh.exec_command("grep -A8 'DEFAULT_ORIGINS' /opt/duijie/server/duijie/app.js | head -10")
exit_code = stdout.channel.recv_exit_status()
print('=== Server CORS config ===')
print(stdout.read().decode())

# Test CORS directly with curl
stdin, stdout, stderr = ssh.exec_command("""curl -s -D - -o /dev/null -H "Origin: http://localhost" -H "Content-Type: application/json" -X POST -d '{"username":"test","password":"test"}' http://localhost:1800/api/auth/login""")
exit_code = stdout.channel.recv_exit_status()
print('=== CORS test from http://localhost ===')
print(stdout.read().decode())

# Also test what Nginx does
stdin, stdout, stderr = ssh.exec_command("""curl -s -D - -o /dev/null -H "Origin: http://localhost" -H "Content-Type: application/json" -H "User-Agent: DuiJie-App/1.0 Android" -X POST -d '{"username":"test","password":"test"}' http://localhost:8080/api/auth/login""")
exit_code = stdout.channel.recv_exit_status()
print('=== CORS test through Nginx ===')
print(stdout.read().decode())

ssh.close()
