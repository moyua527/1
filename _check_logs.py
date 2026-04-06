import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

cmd1 = 'grep -E "upload|review" /root/.pm2/logs/duijie-out.log | tail -30'
_, o, _ = ssh.exec_command(cmd1)
print("=== OUT ===")
print(o.read().decode('utf-8', errors='replace'))

cmd2 = 'grep -E "upload|review" /root/.pm2/logs/duijie-error.log | tail -20'
_, o, _ = ssh.exec_command(cmd2)
print("=== ERR ===")
print(o.read().decode('utf-8', errors='replace'))

# Also check nginx error log
cmd3 = 'tail -30 /var/log/nginx/error.log 2>/dev/null || echo "no nginx log"'
_, o, _ = ssh.exec_command(cmd3)
print("=== NGINX ERR ===")
print(o.read().decode('utf-8', errors='replace'))

ssh.close()
