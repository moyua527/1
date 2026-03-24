import paramiko, os, stat, getpass

SERVER = '160.202.253.143'
USER = 'root'
REMOTE_BASE = '/opt/duijie'
LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))

def ssh_connect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USER, password=os.environ.get('SSH_PASS') or getpass.getpass(f'SSH password for {USER}@{SERVER}: '))
    return ssh

def run_cmd(ssh, cmd, desc=''):
    if desc: print(f'  → {desc}')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip(): print(f'    {out.strip()[:200]}')
    if err.strip() and 'Warning' not in err: print(f'    [ERR] {err.strip()[:200]}')
    return out

def upload_dir(sftp, local_dir, remote_dir):
    try: sftp.stat(remote_dir)
    except: sftp.mkdir(remote_dir)
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'
        if os.path.isfile(local_path):
            sftp.put(local_path, remote_path)
            print(f'    ↑ {remote_path}')
        elif os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)

def main():
    ssh = ssh_connect()
    sftp = ssh.open_sftp()

    # Read DB creds from server .env
    env_out = run_cmd(ssh, f'cat {REMOTE_BASE}/server/duijie/.env', 'Reading .env')
    db_user = db_pass = db_name = ''
    for line in env_out.split('\n'):
        if line.startswith('DB_USER='): db_user = line.split('=',1)[1].strip()
        if line.startswith('DB_PASSWORD='): db_pass = line.split('=',1)[1].strip()
        if line.startswith('DB_NAME='): db_name = line.split('=',1)[1].strip()

    # 1. Upload backend files
    print('\n[1/5] Uploading backend files...')
    backend_files = [
        'standalone.js',
        'package.json',
        'atomic/services/auth/loginService.js',
        'atomic/controllers/auth/registerController.js',
        'atomic/controllers/auth/profileController.js',
        'atomic/controllers/user/createController.js',
        'atomic/controllers/user/updateController.js',
        'atomic/middleware/xssMiddleware.js',
        'atomic/repositories/client/createRepo.js',
        'atomic/controllers/project/teamUsersController.js',
        'atomic/services/project/createProject.js',
        'atomic/routes/index.js',
        'atomic/controllers/dm/recallController.js',
        'atomic/repositories/dashboard/statsRepo.js',
        'atomic/controllers/dashboard/chartController.js',
        'atomic/repositories/project/createRepo.js',
        'atomic/controllers/client/clientMembersController.js',
        'atomic/controllers/client/myEnterpriseController.js',
        'atomic/middleware/auth.js',
        'atomic/repositories/project/findAllRepo.js',
        'atomic/controllers/project/listController.js',
        'atomic/controllers/auth/verifyCodeController.js',
        'atomic/controllers/auth/sendCodeController.js',
        'atomic/controllers/auth/forgotPasswordController.js',
        'atomic/controllers/auth/resetPasswordController.js',
        'socket/index.js',
        'atomic/utils/notify.js',
        'atomic/controllers/file/previewController.js',
        'atomic/controllers/dm/sendController.js',
    ]
    remote_server = f'{REMOTE_BASE}/server/duijie'
    for f in backend_files:
        local_f = os.path.join(LOCAL_BASE, 'server', 'duijie', f)
        remote_f = f'{remote_server}/{f}'
        remote_dir = '/'.join(remote_f.split('/')[:-1])
        run_cmd(ssh, f'mkdir -p {remote_dir}')
        sftp.put(local_f, remote_f)
        print(f'    ↑ {remote_f}')

    # 2. Install new npm packages
    print('\n[2/5] Installing npm packages...')
    run_cmd(ssh, f'cd {remote_server} && npm install --production', 'npm install')

    # 2.5. Database migrations (MySQL 8 compatible - ignore duplicate column errors)
    print('\n[2.5/5] Running database migrations...')
    migrations = [
        "ALTER TABLE voice_users ADD COLUMN company_name VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE verification_codes ADD COLUMN used TINYINT(1) DEFAULT 0",
    ]
    for sql in migrations:
        run_cmd(ssh, f"mysql -u{db_user} -p'{db_pass}' {db_name} -e \"{sql}\" 2>&1 || true", sql[:60])

    # 3. Migrate plaintext passwords to bcrypt hashes
    print('\n[3/5] Migrating plaintext passwords to bcrypt...')
    local_migrate = os.path.join(LOCAL_BASE, 'server', 'duijie', 'scripts', 'migrate-passwords.js')
    remote_migrate = f'{remote_server}/scripts/migrate-passwords.js'
    run_cmd(ssh, f'mkdir -p {remote_server}/scripts')
    sftp.put(local_migrate, remote_migrate)
    run_cmd(ssh, f'cd {remote_server} && node scripts/migrate-passwords.js', 'Hashing passwords')

    # 4. Upload frontend dist
    print('\n[4/5] Uploading frontend dist...')
    local_dist = os.path.join(LOCAL_BASE, 'frontend', 'duijieReact', 'dist')
    remote_dist = f'{REMOTE_BASE}/frontend/duijieReact/dist'
    run_cmd(ssh, f'rm -rf {remote_dist}')
    upload_dir(sftp, local_dist, remote_dist)

    # 5. Restart
    print('\n[5/5] Restarting backend...')
    run_cmd(ssh, 'pm2 restart duijie', 'PM2 restart')
    run_cmd(ssh, 'pm2 status', 'PM2 status')

    sftp.close()
    ssh.close()
    print('\n✅ Deploy complete!')

if __name__ == '__main__':
    main()
