import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
transport = ssh.get_transport()
if transport:
    transport.set_keepalive(15)

# Test CORS preflight (OPTIONS) through Nginx
stdin, stdout, stderr = ssh.exec_command("""curl -s -D - -o /dev/null \
  -X OPTIONS \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -H "User-Agent: DuiJie-App/1.0 Android" \
  http://localhost:8080/api/auth/login""")
exit_code = stdout.channel.recv_exit_status()
print('=== Preflight OPTIONS through Nginx ===')
print(stdout.read().decode())

ssh.close()
