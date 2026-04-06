import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', username='root', password='Xiao134679')

# Check recent error log
stdin, stdout, stderr = c.exec_command("tail -30 /root/.pm2/logs/duijie-error.log")
print("=== ERROR LOG (last 30) ===")
print(stdout.read().decode())

# Check recent access log for milestone
stdin, stdout, stderr = c.exec_command("tail -100 /root/.pm2/logs/duijie-out.log | grep -i 'milestone\\|500\\|POST'")
print("\n=== MILESTONE/POST/500 ===")
print(stdout.read().decode())

c.close()
