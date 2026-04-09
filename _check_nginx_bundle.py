import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
cmds = [
    'curl -s -o /dev/null -w "HTTP %{http_code}, Size: %{size_download}, Content-Type: %{content_type}" http://localhost:8080/api/app/bundle/download',
    'curl -sv http://localhost:8080/api/app/bundle/download 2>&1 | head -30',
    'curl -s -H "User-Agent: DuiJie-App/1.0 Android" http://localhost:8080/api/app/bundle',
    'grep -A5 "bundle\|download\|zip" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/* 2>/dev/null | head -30',
]
for cmd in cmds:
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[:500])
    if err and 'Warning' not in err: print(f'[ERR] {err[:300]}')
ssh.close()
