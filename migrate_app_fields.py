import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
cmd = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "
ALTER TABLE duijie_projects ADD COLUMN app_name VARCHAR(100) NULL COMMENT '应用名称' AFTER tags;
ALTER TABLE duijie_projects ADD COLUMN app_url VARCHAR(500) NULL COMMENT '应用链接' AFTER app_name;
" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
err = stderr.read().decode()
if 'Duplicate' in err:
    print('Fields already exist')
elif err:
    print('ERR:', err)
else:
    print('OK: app_name, app_url added')
ssh.close()
