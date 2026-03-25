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

    # 1. Upload backend files (full sync)
    print('\n[1/5] Uploading backend files (full sync)...')
    remote_server = f'{REMOTE_BASE}/server/duijie'
    local_server = os.path.join(LOCAL_BASE, 'server', 'duijie')
    SKIP_DIRS = {'node_modules', 'uploads', 'logs', 'tests', '.env'}
    SYNC_EXTS = {'.js', '.json'}
    upload_count = 0

    def ensure_remote_dir(path):
        try: sftp.stat(path)
        except:
            parts = path.split('/')
            for i in range(2, len(parts) + 1):
                p = '/'.join(parts[:i])
                try: sftp.stat(p)
                except: sftp.mkdir(p)

    def sync_dir(local, remote):
        nonlocal upload_count
        for item in os.listdir(local):
            lp = os.path.join(local, item)
            rp = f'{remote}/{item}'
            if os.path.isdir(lp):
                if item in SKIP_DIRS: continue
                ensure_remote_dir(rp)
                sync_dir(lp, rp)
            elif os.path.isfile(lp) and os.path.splitext(item)[1] in SYNC_EXTS:
                sftp.put(lp, rp)
                upload_count += 1

    for d in ['atomic', 'config', 'socket', 'listeners', 'scripts', 'events']:
        ld = os.path.join(local_server, d)
        if os.path.isdir(ld):
            ensure_remote_dir(f'{remote_server}/{d}')
            sync_dir(ld, f'{remote_server}/{d}')
    for f in ['standalone.js', 'app.js', 'package.json']:
        lp = os.path.join(local_server, f)
        if os.path.isfile(lp):
            sftp.put(lp, f'{remote_server}/{f}')
            upload_count += 1
    print(f'    ↑ {upload_count} files uploaded')

    # 2. Install new npm packages
    print('\n[2/5] Installing npm packages...')
    run_cmd(ssh, f'cd {remote_server} && npm install --production', 'npm install')

    # 2.5. Database migrations (versioned)
    print('\n[2.5/5] Running versioned database migrations...')
    local_migrations = os.path.join(LOCAL_BASE, 'server', 'duijie', 'migrations')
    remote_migrations = f'{remote_server}/migrations'
    run_cmd(ssh, f'mkdir -p {remote_migrations}')
    if os.path.isdir(local_migrations):
        for mf in sorted(os.listdir(local_migrations)):
            if mf.endswith('.sql'):
                sftp.put(os.path.join(local_migrations, mf), f'{remote_migrations}/{mf}')
                print(f'    ↑ {remote_migrations}/{mf}')
    local_migrate_script = os.path.join(LOCAL_BASE, 'server', 'duijie', 'scripts', 'migrate.js')
    remote_migrate_script = f'{remote_server}/scripts/migrate.js'
    sftp.put(local_migrate_script, remote_migrate_script)
    run_cmd(ssh, f'cd {remote_server} && node scripts/migrate.js', 'Running migrations')

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
