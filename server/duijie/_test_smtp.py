import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('160.202.253.143', 22, 'root', 'Xiao134679')

script = r"""
require('dotenv').config();
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER);
const {sendVerificationCode} = require('./config/mailer');
sendVerificationCode('15927633579@163.com', '888888', '测试').then(r => {
  console.log('send result:', r);
  setTimeout(() => process.exit(0), 2000);
}).catch(e => {
  console.error('send error:', e.message);
  setTimeout(() => process.exit(1), 1000);
});
"""

# Write test script to server
sftp = c.open_sftp()
with sftp.open('/opt/duijie/server/duijie/_test_smtp.js', 'w') as f:
    f.write(script)
sftp.close()

# Run it
stdin, stdout, stderr = c.exec_command('cd /opt/duijie/server/duijie && node _test_smtp.js', timeout=30)
print('STDOUT:', stdout.read().decode())
print('STDERR:', stderr.read().decode())

# Clean up
c.exec_command('rm /opt/duijie/server/duijie/_test_smtp.js')
c.close()
print('DONE')
