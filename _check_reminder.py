import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
cmd = "mysql -u duijie -p'DuiJie@2024!' duijie_db -e \"SELECT id, milestone_id, remind_at, DATE_FORMAT(remind_at, '%Y/%c/%e %H:%i') AS fmt FROM duijie_milestone_reminders ORDER BY id DESC LIMIT 5;\" 2>&1"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
