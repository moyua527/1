import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
cmds = [
    'cd /opt/duijie/downloads && python3 -c "import zipfile; z=zipfile.ZipFile(\'dist.zip\'); [print(i.filename, i.file_size) for i in z.infolist()[:15]]"',
    'cd /opt/duijie/downloads && python3 -c "import zipfile; z=zipfile.ZipFile(\'dist.zip\'); print(\'Total files:\', len(z.infolist())); print(\'Has index.html:\', \'index.html\' in z.namelist())"',
]
for cmd in cmds:
    print(f'\n=== checking zip ===')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f'[ERR] {err}')
ssh.close()
