import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', username='root', password='Xiao134679')

f = '/opt/duijie/frontend/duijieReact/dist/assets/ProjectDetail-CqJyvks_.js'

stdin, stdout, stderr = c.exec_command(f"grep -boP 'function Pn\\(' {f}")
print("Pn offset:", stdout.read().decode())

stdin, stdout, stderr = c.exec_command(f"grep -boP 'function Mn\\(' {f}")
print("Mn offset:", stdout.read().decode())

for func in ['Cn', 'Dn', 'Mn', 'Pn', 'Fn']:
    stdin, stdout, stderr = c.exec_command(f"grep -oP 'function {func}\\(\\{{[^}}]{{0,200}}' {f}")
    out = stdout.read().decode()[:300]
    print(f"{func}: {out}")

c.close()
