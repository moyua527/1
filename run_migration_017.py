import paramiko

sql = open('server/duijie/migrations/017_project_client_requests.sql').read()
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
stdin, stdout, stderr = ssh.exec_command(f'mysql -u root -pXiao134679 duijie_db -e "{sql}"')
print('STDOUT:', stdout.read().decode())
print('STDERR:', stderr.read().decode())
ssh.close()
print('Migration done')
