import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', username='root', password='Xiao134679')

# List ALL files in dist/assets
stdin, stdout, stderr = c.exec_command("ls -la /opt/duijie/frontend/duijieReact/dist/assets/ | grep -i project")
print("=== All ProjectDetail files ===")
print(stdout.read().decode())

# Check what index.html has
stdin, stdout, stderr = c.exec_command("cat /opt/duijie/frontend/duijieReact/dist/index.html")
print("=== index.html ===")
print(stdout.read().decode()[:2000])

# Check total files count in assets
stdin, stdout, stderr = c.exec_command("ls /opt/duijie/frontend/duijieReact/dist/assets/ | wc -l")
print("\n=== Total assets count ===")
print(stdout.read().decode())

# List the latest files
stdin, stdout, stderr = c.exec_command("ls -lt /opt/duijie/frontend/duijieReact/dist/assets/ | head -20")
print("=== Latest files ===")
print(stdout.read().decode())

c.close()
