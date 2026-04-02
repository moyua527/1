import paramiko, os, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS', 'Xiao134679'))

cmds = [
    ('git pull', 'cd /opt/duijie && git pull origin main'),
    ('build frontend', 'cd /opt/duijie/frontend/duijieReact && npx vite build'),
    ('restart PM2', 'pm2 restart duijie'),
    ('health check', 'sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/app/version'),
]

for label, cmd in cmds:
    print(f'\n>>> [{label}] {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[:500])
    if err and 'Warning' not in err and 'warn' not in err:
        print(f'[ERR] {err[:300]}')
    if exit_code != 0:
        print(f'[EXIT CODE: {exit_code}]')

ssh.close()
print('\nDone!')
