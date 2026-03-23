import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')

cmds = [
    "mysql -uduijie -p'DuiJie@2024!' duijie_db -e \"SHOW COLUMNS FROM voice_users LIKE 'company_name';\"",
    "mysql -uduijie -p'DuiJie@2024!' duijie_db -e \"SHOW COLUMNS FROM verification_codes LIKE 'used';\"",
]
for cmd in cmds:
    print(f'> {cmd[:80]}')
    i, o, e = ssh.exec_command(cmd)
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    if out: print(f'  {out}')
    if not out: print('  (empty - column missing)')
    if err and 'Warning' not in err: print(f'  [ERR] {err}')

# Add missing columns
fixes = [
    "ALTER TABLE voice_users ADD COLUMN company_name VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE verification_codes ADD COLUMN used TINYINT(1) DEFAULT 0",
]
for sql in fixes:
    print(f'\n> Fixing: {sql[:60]}...')
    i, o, e = ssh.exec_command(f"mysql -uduijie -p'DuiJie@2024!' duijie_db -e \"{sql}\"")
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    if out: print(f'  {out}')
    if err:
        if 'Duplicate column' in err:
            print('  (already exists, OK)')
        elif 'Warning' not in err:
            print(f'  [ERR] {err}')
        else:
            print('  OK')

ssh.close()
print('\nDone!')
