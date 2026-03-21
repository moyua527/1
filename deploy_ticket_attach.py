import paramiko, os

LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
sftp = ssh.open_sftp()

# 1. Create ticket_attachments table
print('Creating ticket_attachments table...')
sql = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "
CREATE TABLE IF NOT EXISTS duijie_ticket_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  reply_id INT DEFAULT NULL,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  file_size INT DEFAULT 0,
  mime_type VARCHAR(100),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_reply_id (reply_id)
);"
"""
stdin, stdout, stderr = ssh.exec_command(sql)
print(stdout.read().decode())
err = stderr.read().decode()
if err and 'Warning' not in err: print(f'[ERR] {err}')

# 2. Upload backend files
print('Uploading backend files...')
files = [
    ('server/duijie/atomic/controllers/ticket/createController.js', '/opt/duijie/server/duijie/atomic/controllers/ticket/createController.js'),
    ('server/duijie/atomic/controllers/ticket/replyController.js', '/opt/duijie/server/duijie/atomic/controllers/ticket/replyController.js'),
    ('server/duijie/atomic/controllers/ticket/detailController.js', '/opt/duijie/server/duijie/atomic/controllers/ticket/detailController.js'),
    ('server/duijie/atomic/routes/index.js', '/opt/duijie/server/duijie/atomic/routes/index.js'),
]
for local, remote in files:
    sftp.put(os.path.join(LOCAL_BASE, local), remote)
    print(f'  ↑ {remote}')

# 3. Upload frontend dist
print('Uploading frontend dist...')
def upload_dir(local_dir, remote_dir):
    try: sftp.stat(remote_dir)
    except: sftp.mkdir(remote_dir)
    for item in os.listdir(local_dir):
        lp = os.path.join(local_dir, item)
        rp = f'{remote_dir}/{item}'
        if os.path.isfile(lp):
            sftp.put(lp, rp)
            print(f'  ↑ {rp}')
        elif os.path.isdir(lp):
            upload_dir(lp, rp)

dist = os.path.join(LOCAL_BASE, 'frontend', 'duijieReact', 'dist')
remote_dist = '/opt/duijie/frontend/duijieReact/dist'
ssh.exec_command(f'rm -rf {remote_dist}')[1].read()
upload_dir(dist, remote_dist)

# 4. Restart PM2
print('Restarting PM2...')
ssh.exec_command('pm2 restart duijie')[1].read()

sftp.close()
ssh.close()
print('✅ Done')
