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

    # 1. DB Migration
    print('\n[1/4] DB Migration...')
    migration_sql = """
CREATE TABLE IF NOT EXISTS duijie_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type ENUM('requirement','bug','question','other') DEFAULT 'question',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status ENUM('open','processing','resolved','closed') DEFAULT 'open',
  project_id INT,
  created_by INT NOT NULL,
  assigned_to INT,
  resolved_at TIMESTAMP NULL,
  rating TINYINT NULL,
  rating_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_created_by (created_by),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_status (status),
  INDEX idx_project_id (project_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS duijie_ticket_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  content TEXT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""
    # Read DB creds from server .env
    env_out = run_cmd(ssh, f'cat {REMOTE_BASE}/server/duijie/.env', 'Reading .env')
    db_user = db_pass = db_name = ''
    for line in env_out.split('\n'):
        if line.startswith('DB_USER='): db_user = line.split('=',1)[1].strip()
        if line.startswith('DB_PASSWORD='): db_pass = line.split('=',1)[1].strip()
        if line.startswith('DB_NAME='): db_name = line.split('=',1)[1].strip()
    
    run_cmd(ssh, f'echo "{migration_sql}" | mysql -u{db_user} -p\'{db_pass}\' {db_name}', 'Running migration')

    # 2. Upload frontend dist
    print('\n[2/4] Uploading frontend dist...')
    local_dist = os.path.join(LOCAL_BASE, 'frontend', 'duijieReact', 'dist')
    remote_dist = f'{REMOTE_BASE}/frontend/duijieReact/dist'
    run_cmd(ssh, f'rm -rf {remote_dist}')
    upload_dir(sftp, local_dist, remote_dist)

    # 3. Upload backend files
    print('\n[3/4] Uploading backend files...')
    backend_files = [
        'atomic/routes/index.js',
        'atomic/repositories/dashboard/statsRepo.js',
        'atomic/controllers/dm/usersController.js',
        'atomic/controllers/ticket/createController.js',
        'atomic/controllers/ticket/listController.js',
        'atomic/controllers/ticket/detailController.js',
        'atomic/controllers/ticket/updateController.js',
        'atomic/controllers/ticket/replyController.js',
        'atomic/controllers/ticket/rateController.js',
    ]
    remote_server = f'{REMOTE_BASE}/server/duijie'
    for f in backend_files:
        local_f = os.path.join(LOCAL_BASE, 'server', 'duijie', f)
        remote_f = f'{remote_server}/{f}'
        remote_dir = '/'.join(remote_f.split('/')[:-1])
        run_cmd(ssh, f'mkdir -p {remote_dir}')
        sftp.put(local_f, remote_f)
        print(f'    ↑ {remote_f}')

    # 4. Restart
    print('\n[4/4] Restarting backend...')
    run_cmd(ssh, 'pm2 restart duijie', 'PM2 restart')
    run_cmd(ssh, 'pm2 status', 'PM2 status')

    sftp.close()
    ssh.close()
    print('\n✅ Deploy complete!')

if __name__ == '__main__':
    main()
