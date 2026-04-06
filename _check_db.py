import paramiko, re
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', username='root', password='Xiao134679')

stdin, stdout, stderr = c.exec_command('cat /opt/duijie/server/duijie/.env')
env = stdout.read().decode()
m = re.search(r'DB_PASSWORD=(.+)', env)
dbpass = m.group(1).strip() if m else ''

queries = [
    "SELECT id, title, due_date, is_completed FROM duijie_milestones WHERE is_deleted=0 LIMIT 20",
    "SELECT * FROM duijie_milestone_progress ORDER BY id DESC LIMIT 5",
    "SELECT * FROM duijie_milestone_reminders LIMIT 5",
    "SELECT * FROM duijie_milestone_participants LIMIT 10",
]
for q in queries:
    print(f"\n=== {q[:70]}... ===")
    cmd = f"mysql -u duijie -p'{dbpass}' duijie_db -e \"{q}\" 2>/dev/null"
    stdin, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode()[:1000])

c.close()
