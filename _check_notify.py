import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

cmds = [
    ("Check reminder status", "mysql -u duijie -p'DuiJie@2024!' duijie_db -e \"SELECT id, milestone_id, user_id, remind_at, is_sent, note FROM duijie_milestone_reminders ORDER BY id DESC LIMIT 5;\" 2>&1"),
    ("Check notifications", "mysql -u duijie -p'DuiJie@2024!' duijie_db -e \"SELECT id, user_id, type, title, content, is_read, created_at FROM duijie_notifications WHERE type='follow_reminder' ORDER BY id DESC LIMIT 5;\" 2>&1"),
    ("Check PM2 logs", "pm2 logs duijie --lines 30 --nostream 2>&1"),
    ("Server time", "date '+%Y-%m-%d %H:%M:%S %Z'"),
]

for desc, cmd in cmds:
    print(f"\n=== {desc} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip(): print(out.strip()[:1000])
    if err.strip(): print(f"[ERR] {err.strip()[:300]}")

ssh.close()
