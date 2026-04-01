import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

cmd = "mysql -u root -p'Xiao134679' duijie_db -e \"SHOW CREATE TABLE duijie_project_client_requests\\G\""
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())

# also check existing records for project 39
cmd2 = "mysql -u root -p'Xiao134679' duijie_db -e \"SELECT * FROM duijie_project_client_requests WHERE project_id = 39 OR to_enterprise_id = 25\""
stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
print(stdout2.read().decode())
ssh.close()
