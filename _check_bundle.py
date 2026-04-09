import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
cmds = [
    'curl -s http://localhost:1800/api/app/bundle',
    'curl -s -o /dev/null -w "HTTP %{http_code}, Size: %{size_download}" http://localhost:1800/api/app/bundle/download',
    'curl -s -o /dev/null -w "HTTP %{http_code}, Size: %{size_download}" -H "User-Agent: okhttp/4.0" http://localhost:1800/api/app/bundle/download',
    'curl -s -o /dev/null -w "HTTP %{http_code}, Size: %{size_download}" -H "User-Agent: Java/11" http://localhost:1800/api/app/bundle/download',
    'curl -s -o /dev/null -w "HTTP %{http_code}" -H "User-Agent: " http://localhost:1800/api/app/bundle/download',
    'ls -la /opt/duijie/downloads/dist.zip',
    'pm2 logs duijie --lines 20 --nostream 2>&1 | grep -i bundle',
]
for cmd in cmds:
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f'[ERR] {err}')
ssh.close()
