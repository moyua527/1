import paramiko, os

LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
sftp = ssh.open_sftp()

# 1. Create verification_codes table
print('Creating verification_codes table...')
sql = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('phone','email') NOT NULL,
  target VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  used TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target_type (target, type),
  INDEX idx_expires (expires_at)
);"
"""
stdin, stdout, stderr = ssh.exec_command(sql)
print(stdout.read().decode())
err = stderr.read().decode()
if err and 'Warning' not in err: print(f'[ERR] {err}')

# 2. Upload backend files
print('Uploading backend files...')
files = [
    ('server/duijie/atomic/controllers/auth/sendCodeController.js', '/opt/duijie/server/duijie/atomic/controllers/auth/sendCodeController.js'),
    ('server/duijie/atomic/controllers/auth/loginByCodeController.js', '/opt/duijie/server/duijie/atomic/controllers/auth/loginByCodeController.js'),
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
