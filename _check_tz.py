import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

cmds = [
    ("MySQL timezone", "mysql -u duijie -p'DuiJie@2024!' duijie_db -e \"SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();\" 2>&1"),
    ("System timezone", "timedatectl show --property=Timezone --value 2>&1 || cat /etc/timezone 2>&1 || date +%Z"),
    ("Node TZ env", "pm2 env 0 2>&1 | grep -i tz || echo 'no TZ env'"),
]

for desc, cmd in cmds:
    print(f"\n=== {desc} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode().strip()[:500])
    err = stderr.read().decode().strip()
    if err and 'Warning' not in err: print(f"[ERR] {err[:300]}")

ssh.close()
