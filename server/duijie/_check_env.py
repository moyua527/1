import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', 22, 'root', 'Xiao134679')

stdin, stdout, stderr = c.exec_command('cat /opt/duijie/server/duijie/.env')
content = stdout.read().decode()
print('=== .env content ===')
print(content)
print('=== end ===')

# Check exact bytes of SMTP_PASS line
stdin, stdout, stderr = c.exec_command("grep SMTP_PASS /opt/duijie/server/duijie/.env | xxd | head -3")
print('SMTP_PASS hex:')
print(stdout.read().decode())

c.close()
