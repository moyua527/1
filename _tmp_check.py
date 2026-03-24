import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', username='root', password='Xiao134679')
cmds = [
    "which sendmail postfix mailx msmtp 2>/dev/null || echo 'no mail tools'",
    "systemctl list-units --type=service 2>/dev/null | grep -i mail",
    "dpkg -l 2>/dev/null | grep -i -E 'postfix|sendmail|mailutils|exim' || rpm -qa 2>/dev/null | grep -i -E 'postfix|sendmail|mailx'",
    "npm list nodemailer 2>/dev/null || echo 'nodemailer not installed'",
]
for cmd in cmds:
    print(f"\n$ {cmd}")
    i, o, e = c.exec_command(cmd)
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(out or err or '(empty)')
c.close()
