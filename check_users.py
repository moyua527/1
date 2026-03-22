import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
cmd = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "SELECT id,username,nickname,role,is_active,is_deleted FROM voice_users ORDER BY id;" """
si, so, se = ssh.exec_command(cmd)
print(so.read().decode())
ssh.close()
