import paramiko

host = "160.202.253.143"
port = 22
username = "root"
password = "Xiao134679"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=username, password=password, timeout=15)

# Upload SQL file via SFTP
sftp = client.open_sftp()
sftp.put("init-db.sql", "/tmp/duijie-init.sql")
sftp.close()
print("SQL file uploaded")

# Execute SQL
stdin, stdout, stderr = client.exec_command("mysql -u root -p'Xiao134679' voice_room_db < /tmp/duijie-init.sql", timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
if out: print(out)
if 'ERROR' in err: print(f"[ERROR] {err}")

# Verify
stdin, stdout, stderr = client.exec_command("mysql -u root -p'Xiao134679' voice_room_db -e \"SHOW TABLES LIKE 'duijie_%';\"", timeout=10)
print("\n=== duijie tables ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Cleanup
client.exec_command("rm /tmp/duijie-init.sql")
client.close()
print("Done!")
