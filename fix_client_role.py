import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
cmd = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "UPDATE voice_users SET role='member' WHERE role='client' AND is_deleted=0; SELECT id,username,nickname,role FROM voice_users WHERE is_deleted=0 ORDER BY id DESC LIMIT 5;" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
err = stderr.read().decode()
if 'ERROR' in err:
    print('ERR:', err)
else:
    print('OK: client roles changed to member')
ssh.close()
