import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS', 'Xiao134679'))

def run_cmd(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return exit_code, out, err

# Write SQL file to server, then execute it
sql_content = """
ALTER TABLE duijie_tasks ADD COLUMN version INT NOT NULL DEFAULT 0;
ALTER TABLE duijie_projects ADD COLUMN version INT NOT NULL DEFAULT 0;
ALTER TABLE duijie_clients ADD COLUMN version INT NOT NULL DEFAULT 0;
ALTER TABLE duijie_tickets ADD COLUMN version INT NOT NULL DEFAULT 0;
"""

# Upload SQL via echo
run_cmd(f"echo '{sql_content}' > /tmp/migration_018.sql")

# Read DB creds from .env
code, out, err = run_cmd("grep -E '^DB_(USER|PASSWORD|NAME)=' /opt/duijie/server/duijie/.env")
creds = {}
for line in out.split('\n'):
    if '=' in line:
        k, v = line.strip().split('=', 1)
        creds[k] = v

db_user = creds.get('DB_USER', 'root')
db_pass = creds.get('DB_PASSWORD', '')
db_name = creds.get('DB_NAME', 'duijie_db')
print(f'DB: {db_user}@{db_name}')

# Check if version column already exists
code, out, err = run_cmd(
    f"mysql -u {db_user} -p{db_pass} {db_name} -N -e "
    f"\"SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{db_name}' AND TABLE_NAME='duijie_tasks' AND COLUMN_NAME='version';\""
)
if out.strip() == '1':
    print('version column already exists, skipping migration')
else:
    # Execute migration - each ALTER separately to handle partial failures
    tables = ['duijie_tasks', 'duijie_projects', 'duijie_clients', 'duijie_tickets']
    for table in tables:
        code, out, err = run_cmd(
            f"mysql -u {db_user} -p{db_pass} {db_name} -e "
            f"\"ALTER TABLE {table} ADD COLUMN version INT NOT NULL DEFAULT 0;\""
        )
        if code == 0:
            print(f'OK: {table}')
        else:
            if 'Duplicate column' in err:
                print(f'SKIP: {table} (already exists)')
            else:
                print(f'ERR: {table}: {err}')

ssh.close()
print('Migration 018 complete')
