import paramiko, os, json
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS', 'Xiao134679'))
cmd = """cd /opt/duijie/server/duijie && node -e "
const db = require('./config/db');
(async () => {
  const [rows] = await db.query('SELECT id FROM duijie_milestones WHERE project_id = 48 AND is_deleted = 0 LIMIT 1');
  if (rows.length === 0) { console.log('NO MILESTONES'); process.exit(); }
  const msId = rows[0].id;
  const [[ms]] = await db.query('SELECT * FROM duijie_milestones WHERE id = ?', [msId]);
  console.log('MILESTONE:', JSON.stringify(ms));
  const [pts] = await db.query('SELECT * FROM duijie_milestone_participants WHERE milestone_id = ?', [msId]);
  console.log('PARTICIPANTS:', JSON.stringify(pts));
  process.exit();
})();
"
"""
_, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode()
print(out[:2000])
err = stderr.read().decode()
if err.strip(): print('ERR:', err.strip()[:300])
ssh.close()
