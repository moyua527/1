import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

# Check if voice_users has the same columns as expected for duijie_users
cmd = "mysql -u duijie -pDuiJie@2024! duijie_db -e \"DESCRIBE voice_users;\" 2>&1"
_, out, _ = ssh.exec_command(cmd)
print("voice_users schema:")
print(out.read().decode())

# Check if there's a VIEW named duijie_users
cmd2 = "mysql -u duijie -pDuiJie@2024! duijie_db -e \"SHOW FULL TABLES WHERE Table_type = 'VIEW';\" 2>&1"
_, out2, _ = ssh.exec_command(cmd2)
print("\nVIEWS:")
print(out2.read().decode())

# Test if duijie_users exists at all (maybe case sensitivity?)
cmd3 = "mysql -u duijie -pDuiJie@2024! duijie_db -e \"SELECT COUNT(*) FROM duijie_users;\" 2>&1"
_, out3, _ = ssh.exec_command(cmd3)
print("\nduijie_users COUNT:")
print(out3.read().decode())

# Check the actual Node.js log for the messages endpoint error
cmd4 = "pm2 logs duijie --lines 200 --nostream 2>&1 | grep -i 'error\\|milestone\\|messages\\|duijie_users' | tail -20"
_, out4, _ = ssh.exec_command(cmd4)
print("\nRELEVANT LOGS:")
print(out4.read().decode())

ssh.close()
