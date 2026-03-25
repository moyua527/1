import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ['SSH_PASS'])

cmds = [
    ('pm2 status', 'PM2状态'),
    ('pm2 logs duijie --err --lines 15 --nostream', '错误日志'),
    ('curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/auth/register-config', 'API健康检查'),
    ('nginx -t 2>&1', 'Nginx配置'),
    ('systemctl is-active nginx', 'Nginx运行状态'),
]
for cmd, desc in cmds:
    print(f'\n=== {desc} ===')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[-800:])
    if err and 'Warning' not in err: print(err[-400:])
ssh.close()
