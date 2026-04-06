import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

cmd = "mysql -u duijie -pDuiJie@2024! duijie_db -e \"SHOW TABLES LIKE '%user%';\""
_, out, err = ssh.exec_command(cmd)
print("TABLES with 'user':")
print(out.read().decode())
print(err.read().decode())

cmd2 = "mysql -u duijie -pDuiJie@2024! duijie_db -e \"SHOW TABLES;\""
_, out2, err2 = ssh.exec_command(cmd2)
print("\nALL TABLES:")
print(out2.read().decode())
print(err2.read().decode())

ssh.close()
