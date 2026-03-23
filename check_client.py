import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
cmd = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "SELECT c.id, c.user_id, c.client_type, c.name, c.company, u.username, u.nickname, u.role FROM duijie_clients c LEFT JOIN voice_users u ON c.user_id = u.id WHERE c.is_deleted=0;" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
ssh.close()
