import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS', 'Xiao134679'))

backup_script = r"""#!/bin/bash
BACKUP_DIR=/opt/duijie/backups/uploads
SRC_DIR=/opt/duijie/server/duijie/uploads
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
tar czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $(dirname $SRC_DIR) $(basename $SRC_DIR)
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete
echo "[$(date)] Backup done: uploads_$DATE.tar.gz"
"""

sftp = ssh.open_sftp()
with sftp.file('/opt/duijie/backup_uploads.sh', 'w') as f:
    f.write(backup_script)
sftp.close()

cmds = [
    'chmod +x /opt/duijie/backup_uploads.sh',
    'mkdir -p /opt/duijie/backups/uploads',
    '(crontab -l 2>/dev/null; echo "0 3 * * * /opt/duijie/backup_uploads.sh >> /opt/duijie/backups/backup.log 2>&1") | crontab -',
    'crontab -l',
    '/opt/duijie/backup_uploads.sh',
]

for c in cmds:
    print(f'>>> {c}')
    _, o, e = ssh.exec_command(c)
    out = o.read().decode()
    err = e.read().decode()
    if out: print(out)
    if err and 'no crontab' not in err: print(f'ERR: {err}')

ssh.close()
print('\nDone! Uploads backup cron job set up.')
