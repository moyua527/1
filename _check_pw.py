import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
cmds = [
    'pm2 logs duijie --lines 30 --nostream 2>&1 | grep -i "change-password\\|password\\|PUT"',
    'curl -s -X PUT http://localhost:1800/api/auth/change-password -H "Content-Type: application/json" -d \'{"currentPassword":"test","newPassword":"Test12345"}\' -H "Authorization: Bearer fake"',
    'cat /opt/duijie/server/duijie/atomic/controllers/auth/changePasswordController.js | head -20',
]
for cmd in cmds:
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[:600])
    if err and 'Warning' not in err: print(f'[ERR] {err[:300]}')
ssh.close()
