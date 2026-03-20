import paramiko

host = "160.202.253.143"
port = 22
username = "root"
password = "Xiao134679"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=username, password=password, timeout=15)

sql = "DROP TABLE IF EXISTS duijie_messages, duijie_files, duijie_milestones, duijie_tasks, duijie_projects, duijie_clients;"
cmd = f"mysql -u root -p'Xiao134679' voice_room_db -e \"{sql}\""
stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if 'ERROR' in err: print(f"[ERROR] {err}")

# Verify
stdin, stdout, stderr = client.exec_command("mysql -u root -p'Xiao134679' voice_room_db -e \"SHOW TABLES LIKE 'duijie_%';\"", timeout=10)
result = stdout.read().decode('utf-8', errors='replace').strip()
print(f"\n=== Remaining duijie tables: {'(none)' if not result or 'duijie_' not in result else result} ===")

client.close()
print("Remote tables dropped!")
