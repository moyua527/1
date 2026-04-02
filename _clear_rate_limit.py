"""清除速率限制记录"""
import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS', 'Xiao134679'))

cmd = """cd /opt/duijie/server/duijie && node -e '
require("dotenv").config();
const db = require("./config/db");
db.query("TRUNCATE TABLE rate_limit_store").then(() => {
  console.log("rate_limit_store cleared");
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
'"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
err = stderr.read().decode()
if err:
    print('STDERR:', err)
ssh.close()
print('Done')
