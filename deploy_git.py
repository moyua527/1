import paramiko, os, json, getpass, time, sys
from datetime import datetime

SERVER = '160.202.253.143'
USER = 'root'
REMOTE_BASE = '/opt/duijie'
REPO_URL = 'https://github.com/moyua527/1.git'
LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))

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

def run_cmd(ssh, cmd, label='', fatal=False, timeout=300):
    if label:
        print(f'  → {label}')
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    exit_code = stdout.channel.recv_exit_status()
    if out:
        print(f'    {out}')
    if err:
        print(f'    [ERR] {err}')
    if fatal and exit_code != 0:
        print(f'\n❌ 命令失败 (exit {exit_code}): {cmd}')
        sys.exit(1)
    return out

def main():
    version = get_version()
    deploy_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'\n🚀 Git Pull 部署 DuiJie v{version}  ({deploy_time})')
    print(f'   目标: {USER}@{SERVER}:{REMOTE_BASE}\n')

    ssh = ssh_connect()
    remote_server = f'{REMOTE_BASE}/server/duijie'

    # 0. 检查服务器是否已有 git 仓库
    check = run_cmd(ssh, f'test -d {REMOTE_BASE}/.git && echo "GIT_OK" || echo "NO_GIT"')
    if 'NO_GIT' in check:
        print('[0/6] 初始化服务器 Git 仓库...')
        run_cmd(ssh, f'cd {REMOTE_BASE} && git init', 'git init')
        run_cmd(ssh, f'cd {REMOTE_BASE} && git remote add origin {REPO_URL}', 'git remote add')
        run_cmd(ssh, f'cd {REMOTE_BASE} && git fetch origin main', 'git fetch', fatal=True)
        run_cmd(ssh, f'cd {REMOTE_BASE} && git checkout -f main', 'git checkout main', fatal=True)
        print('    ✅ Git 仓库初始化完成\n')

    # 1. Git Pull
    print('[1/6] Git pull...')
    pull_out = run_cmd(ssh, f'cd {REMOTE_BASE} && git pull origin main', 'git pull origin main', fatal=True)

    # 2. 后端 npm install
    print('\n[2/6] 安装后端依赖...')
    run_cmd(ssh, f'cd {remote_server} && npm install --omit=dev 2>&1', 'npm install')

    # 3. 数据库迁移
    print('\n[3/6] 数据库迁移...')
    run_cmd(ssh, f'cd {remote_server} && node scripts/migrate.js', 'migrate', fatal=True)

    # 3.5 密码迁移
    run_cmd(ssh, f'cd {remote_server} && node scripts/migrate-passwords.js', 'password migrate')

    # 4. 前端构建
    print('\n[4/6] 前端构建...')
    remote_fe = f'{REMOTE_BASE}/frontend/duijieReact'
    run_cmd(ssh, f'cd {remote_fe} && npm install --legacy-peer-deps 2>&1', 'npm install (frontend)', timeout=600)
    run_cmd(ssh, f'cd {remote_fe} && npm run build 2>&1', 'npm run build', fatal=True, timeout=600)

    # 5. 重启后端
    print('\n[5/6] 重启后端...')
    run_cmd(ssh, 'pm2 restart duijie', 'PM2 restart')
    run_cmd(ssh, 'pm2 status', 'PM2 status')

    # 5.5 JS 数据迁移
    js_migration = f'{remote_server}/migrations/035_backfill_default_project_roles.js'
    try:
        sftp = ssh.open_sftp()
        sftp.stat(js_migration)
        sftp.close()
        print('\n[5.5] 回填默认项目角色...')
        run_cmd(ssh, f'cd {remote_server} && node migrations/035_backfill_default_project_roles.js', 'Backfill roles')
    except:
        pass

    # 6. 健康检查
    print('\n[6/6] 健康检查...')
    time.sleep(2)
    health_out = run_cmd(ssh, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:1800/api/app/version', 'API health check')
    status_code = health_out.strip()
    if status_code == '200':
        print('    ✅ API 健康检查通过 (HTTP 200)')
    else:
        print(f'    ⚠️  API 返回 HTTP {status_code}，请检查: pm2 logs duijie')

    deploy_log = f'{deploy_time} | v{version} | git-pull | success'
    run_cmd(ssh, f'echo "{deploy_log}" >> {REMOTE_BASE}/deploy.log', 'Writing deploy log')

    ssh.close()
    print(f'\n✅ Git Pull 部署完成! (v{version})')

if __name__ == '__main__':
    main()
