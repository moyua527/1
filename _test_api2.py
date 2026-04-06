import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check server logs for messages endpoint errors
_, out, _ = ssh.exec_command('pm2 logs duijie --lines 50 --nostream 2>&1')
logs = out.read().decode()
print("PM2 LOGS (last 50):")
print(logs[-2000:])

# Test the messages SQL directly
cmd = 'mysql -u duijie -pDuiJie@2024! duijie_db -e "SELECT mm.id, mm.milestone_id, mm.user_id, mm.content, u.username, u.nickname FROM duijie_milestone_messages mm JOIN duijie_users u ON u.id = mm.user_id WHERE mm.milestone_id = 13 ORDER BY mm.created_at ASC;"'
_, out2, _ = ssh.exec_command(cmd)
print("\nSQL RESULT:")
print(out2.read().decode())
print(_.read().decode() if hasattr(_, 'read') else '')

# Also check if the user_id 100041 exists in users table
cmd2 = 'mysql -u duijie -pDuiJie@2024! duijie_db -e "SELECT id, username, nickname FROM duijie_users WHERE id = 100041;"'
_, out3, err3 = ssh.exec_command(cmd2)
print("\nUSER 100041:")
print(out3.read().decode())
print(err3.read().decode())

ssh.close()
