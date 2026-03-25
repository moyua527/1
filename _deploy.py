import paramiko, os

HOST = '160.202.253.143'
USER = 'root'
PWD = 'Xiao134679'
PORT = 22
LOCAL_BASE = r'e:\DuiJie'
REMOTE_BASE = '/opt/duijie'

files_to_upload = [
    'frontend/duijieReact/src/features/enterprise/index.tsx',
    'frontend/duijieReact/src/features/enterprise/useEnterprise.ts',
    'server/duijie/atomic/controllers/client/enterpriseCrudController.js',
]

post_commands = [
    'cd /opt/duijie/frontend/duijieReact && npx vite build 2>&1 | tail -5',
    'pm2 restart duijie 2>&1',
    'pm2 status duijie 2>&1 | head -10',
]

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'Connecting to {HOST}...')
    client.connect(HOST, port=PORT, username=USER, password=PWD, timeout=15)
    print('Connected!\n')

    sftp = client.open_sftp()
    print('=== Uploading files ===')
    for f in files_to_upload:
        local = os.path.join(LOCAL_BASE, f.replace('/', os.sep))
        remote = f'{REMOTE_BASE}/{f}'
        print(f'  {f}')
        sftp.put(local, remote)
    sftp.close()
    print(f'\nUploaded {len(files_to_upload)} files.\n')

    print('=== Running build & restart ===')
    for cmd in post_commands:
        print(f'>>> {cmd}')
        stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        code = stdout.channel.recv_exit_status()
        if out.strip():
            print(out.strip())
        if err.strip() and 'warning' not in err.lower()[:50]:
            print(err.strip())
        print(f'[exit: {code}]\n')

    client.close()
    print('Deploy complete!')

if __name__ == '__main__':
    run()
