import paramiko, os, stat, getpass, json, sys
from datetime import datetime

SERVER = '160.202.253.143'
USER = 'root'
REMOTE_BASE = '/opt/duijie'
LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))

def ensure_remote_dir_tree(sftp, path):
    parts = path.split('/')
    current = ''
    for part in parts:
        if not part:
            continue
        current = f'{current}/{part}'
        try:
            sftp.stat(current)
        except:
            sftp.mkdir(current)

def get_version():
    vf = os.path.join(LOCAL_BASE, 'version.json')
    if os.path.isfile(vf):
        with open(vf) as f:
            return json.load(f).get('version', 'unknown')
    return 'unknown'

def ssh_connect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USER, password=os.environ.get('SSH_PASS') or getpass.getpass(f'SSH password for {USER}@{SERVER}: '))
    transport = ssh.get_transport()
    if transport:
        transport.set_keepalive(15)
    return ssh

def run_cmd(ssh, cmd, desc='', fatal=False):
    if desc: print(f'  → {desc}')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip(): print(f'    {out.strip()[:200]}')
    if err.strip() and 'Warning' not in err: print(f'    [ERR] {err.strip()[:200]}')
    if fatal and exit_code != 0:
        print(f'\n❌ 部署失败：步骤 "{desc}" 返回退出码 {exit_code}')
        print('💡 回滚提示：可在服务器执行 pm2 restart duijie 恢复上次运行状态')
        sys.exit(1)
    return out

def upload_dir(sftp, local_dir, remote_dir):
    ensure_remote_dir_tree(sftp, remote_dir)
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'
        if os.path.isfile(local_path):
            sftp.put(local_path, remote_path)
            print(f'    ↑ {remote_path}')
        elif os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)

def main():
    version = get_version()
    deploy_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'\n🚀 开始部署 DuiJie v{version}  ({deploy_time})')
    print(f'   目标: {USER}@{SERVER}:{REMOTE_BASE}\n')

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

    for d in ['atomic', 'config', 'socket', 'listeners', 'scripts', 'events', 'jobs']:
        ld = os.path.join(local_server, d)
        if os.path.isdir(ld):
            ensure_remote_dir(f'{remote_server}/{d}')
            sync_dir(ld, f'{remote_server}/{d}')
    for f in ['standalone.js', 'app.js', 'package.json', 'firebase-admin-key.json']:
        lp = os.path.join(local_server, f)
        if os.path.isfile(lp):
            sftp.put(lp, f'{remote_server}/{f}')
            upload_count += 1
    print(f'    ↑ {upload_count} files uploaded')

    # 2. Install new npm packages
    print('\n[2/5] Installing npm packages...')
    run_cmd(ssh, f'cd {remote_server} && npm install --production', 'npm install', fatal=True)

    # 2.5. Database migrations (versioned)
    print('\n[2.5/5] Running versioned database migrations...')
    local_migrations = os.path.join(LOCAL_BASE, 'server', 'duijie', 'migrations')
    remote_migrations = f'{remote_server}/migrations'
    run_cmd(ssh, f'mkdir -p {remote_migrations}')
    if os.path.isdir(local_migrations):
        for mf in sorted(os.listdir(local_migrations)):
            if mf.endswith('.sql') or mf.endswith('.js'):
                sftp.put(os.path.join(local_migrations, mf), f'{remote_migrations}/{mf}')
                print(f'    ↑ {remote_migrations}/{mf}')
    local_migrate_script = os.path.join(LOCAL_BASE, 'server', 'duijie', 'scripts', 'migrate.js')
    remote_migrate_script = f'{remote_server}/scripts/migrate.js'
    sftp.put(local_migrate_script, remote_migrate_script)
    run_cmd(ssh, f'cd {remote_server} && node scripts/migrate.js', 'Running migrations', fatal=True)

    # 3. Migrate plaintext passwords to bcrypt hashes
    print('\n[3/5] Migrating plaintext passwords to bcrypt...')
    local_migrate = os.path.join(LOCAL_BASE, 'server', 'duijie', 'scripts', 'migrate-passwords.js')
    remote_migrate = f'{remote_server}/scripts/migrate-passwords.js'
    run_cmd(ssh, f'mkdir -p {remote_server}/scripts')
    sftp.put(local_migrate, remote_migrate)
    run_cmd(ssh, f'cd {remote_server} && node scripts/migrate-passwords.js', 'Hashing passwords')

    # 4. Upload frontend dist (atomic swap to avoid downtime)
    print('\n[4/5] Uploading frontend dist...')
    local_dist = os.path.join(LOCAL_BASE, 'frontend', 'duijieReact', 'dist')
    remote_dist = f'{REMOTE_BASE}/frontend/duijieReact/dist'
    remote_dist_new = f'{REMOTE_BASE}/frontend/duijieReact/dist_new'
    remote_dist_old = f'{REMOTE_BASE}/frontend/duijieReact/dist_old'
    run_cmd(ssh, f'rm -rf {remote_dist_new}')
    upload_dir(sftp, local_dist, remote_dist_new)
    run_cmd(ssh, f'rm -rf {remote_dist_old}; mv {remote_dist} {remote_dist_old} 2>/dev/null; mv {remote_dist_new} {remote_dist}')

    # 4.5. Upload version.json + CHANGELOG.md
    print('\n[4.5/5] Uploading version.json + CHANGELOG.md...')
    local_version = os.path.join(LOCAL_BASE, 'version.json')
    if os.path.isfile(local_version):
        sftp.put(local_version, f'{REMOTE_BASE}/version.json')
        print(f'    ↑ {REMOTE_BASE}/version.json')
    local_changelog = os.path.join(LOCAL_BASE, 'CHANGELOG.md')
    if os.path.isfile(local_changelog):
        sftp.put(local_changelog, f'{REMOTE_BASE}/CHANGELOG.md')
        print(f'    ↑ {REMOTE_BASE}/CHANGELOG.md')

    # 4.6. Create and upload dist.zip for live update
    print('\n[4.6/5] Creating dist.zip for live update...')
    import zipfile
    local_zip = os.path.join(LOCAL_BASE, 'frontend', 'duijieReact', 'dist.zip')
    with zipfile.ZipFile(local_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(local_dist):
            for f in files:
                full = os.path.join(root, f)
                arcname = os.path.relpath(full, local_dist)
                zf.write(full, arcname)
    zip_size_mb = os.path.getsize(local_zip) / 1048576
    print(f'    ✓ dist.zip created ({zip_size_mb:.1f} MB)')
    remote_downloads = f'{REMOTE_BASE}/downloads'
    run_cmd(ssh, f'mkdir -p {remote_downloads}')
    sftp.put(local_zip, f'{remote_downloads}/dist.zip')
    print(f'    ↑ {remote_downloads}/dist.zip')

    # 5. Restart
    print('\n[5/7] Restarting backend...')
    run_cmd(ssh, 'pm2 reload duijie', 'PM2 reload')
    run_cmd(ssh, 'pm2 status', 'PM2 status')

    # 5.5. Run JS data migrations
    js_migration = f'{remote_migrations}/035_backfill_default_project_roles.js'
    try:
        sftp.stat(js_migration)
        print('\n[5.5/7] Backfilling default project roles...')
        run_cmd(ssh, f'cd {remote_server} && node migrations/035_backfill_default_project_roles.js', 'Backfill roles')
    except:
        pass

    # 6. Health check with retries
    print('\n[6/6] Health check...')
    import time
    health_ok = False
    for attempt in range(1, 6):
        time.sleep(3)
        health_out = run_cmd(ssh, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/app/version', f'API health check (attempt {attempt}/5)')
        status_code = health_out.strip()
        if status_code == '200':
            print(f'    ✅ API 健康检查通过 (HTTP 200, attempt {attempt})')
            health_ok = True
            break
        else:
            print(f'    ⏳ attempt {attempt}: HTTP {status_code}, retrying...')
    if not health_ok:
        print(f'    ⚠️  API 5次检查均未通过 (最后 HTTP {status_code})，请检查: pm2 logs duijie')

    # Deploy log
    deploy_log = f'{deploy_time} | v{version} | success'
    run_cmd(ssh, f'echo "{deploy_log}" >> {REMOTE_BASE}/deploy.log', 'Writing deploy log')

    sftp.close()
    ssh.close()
    print(f'\n✅ Deploy complete! (v{version})')

def rollback():
    ssh, sftp = ssh_connect()
    remote_dist = f'{REMOTE_BASE}/frontend/duijieReact/dist'
    remote_dist_old = f'{REMOTE_BASE}/frontend/duijieReact/dist_old'
    print('🔄 Rolling back frontend to previous version...')
    try:
        sftp.stat(remote_dist_old)
    except:
        print('❌ No previous version found (dist_old does not exist)')
        ssh.close()
        return
    run_cmd(ssh, f'rm -rf {remote_dist}; mv {remote_dist_old} {remote_dist}')
    run_cmd(ssh, 'pm2 reload duijie', 'PM2 reload')
    print('✅ Rollback complete. Previous frontend version restored.')
    sftp.close()
    ssh.close()

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--rollback':
        rollback()
    else:
        main()
