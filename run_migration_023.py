"""运行 023 任务工作流迁移"""
import paramiko, os

HOST = '160.202.253.143'
USER = 'root'
PASS = os.environ.get('SSH_PASS', 'Xiao134679')
REMOTE_DIR = '/opt/duijie'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

# 上传迁移文件
sftp = ssh.open_sftp()
local = r'server\duijie\migrations\023_task_workflow.sql'
remote = f'{REMOTE_DIR}/server/duijie/migrations/023_task_workflow.sql'
sftp.put(local, remote)
print(f'已上传 {local}')
sftp.close()

# 读取DB凭证
stdin, stdout, stderr = ssh.exec_command(f'cat {REMOTE_DIR}/server/duijie/.env')
env_content = stdout.read().decode()
db_user = db_pass = db_name = ''
for line in env_content.split('\n'):
    if line.startswith('DB_USER='): db_user = line.split('=',1)[1].strip()
    if line.startswith('DB_PASSWORD='): db_pass = line.split('=',1)[1].strip()
    if line.startswith('DB_NAME='): db_name = line.split('=',1)[1].strip()

# 执行迁移
cmd = f'cd {REMOTE_DIR}/server/duijie && mysql -u {db_user} -p{db_pass} {db_name} < migrations/023_task_workflow.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode()
err = stderr.read().decode()
if out: print(out)
if err: print('STDERR:', err)
print('迁移完成')

ssh.close()
