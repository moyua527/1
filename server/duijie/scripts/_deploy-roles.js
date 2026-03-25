const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const FILES_TO_UPLOAD = [
  // Backend
  { local: 'atomic/middleware/roleGuard.js', remote: '/opt/duijie/server/duijie/atomic/middleware/roleGuard.js' },
  { local: 'atomic/middleware/enterprisePermGuard.js', remote: '/opt/duijie/server/duijie/atomic/middleware/enterprisePermGuard.js' },
  { local: 'atomic/controllers/client/enterpriseRoleController.js', remote: '/opt/duijie/server/duijie/atomic/controllers/client/enterpriseRoleController.js' },
  { local: 'atomic/controllers/client/enterpriseHelpers.js', remote: '/opt/duijie/server/duijie/atomic/controllers/client/enterpriseHelpers.js' },
  { local: 'atomic/controllers/client/enterpriseCrudController.js', remote: '/opt/duijie/server/duijie/atomic/controllers/client/enterpriseCrudController.js' },
  { local: 'atomic/controllers/client/myEnterpriseController.js', remote: '/opt/duijie/server/duijie/atomic/controllers/client/myEnterpriseController.js' },
  { local: 'atomic/routes/client.js', remote: '/opt/duijie/server/duijie/atomic/routes/client.js' },
  { local: 'atomic/routes/project.js', remote: '/opt/duijie/server/duijie/atomic/routes/project.js' },
  { local: 'atomic/routes/task.js', remote: '/opt/duijie/server/duijie/atomic/routes/task.js' },
  { local: 'atomic/routes/admin.js', remote: '/opt/duijie/server/duijie/atomic/routes/admin.js' },
  { local: 'migrations/007_enterprise_roles.sql', remote: '/opt/duijie/server/duijie/migrations/007_enterprise_roles.sql' },
  { local: 'scripts/seed-enterprise-roles.js', remote: '/opt/duijie/server/duijie/scripts/seed-enterprise-roles.js' },
];

const BASE = path.join(__dirname, '..');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected, uploading files...');
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err); conn.end(); return; }

    let i = 0;
    function uploadNext() {
      if (i >= FILES_TO_UPLOAD.length) {
        console.log('\nAll files uploaded. Running migration + restart...\n');
        conn.exec('cd /opt/duijie/server/duijie && node scripts/seed-enterprise-roles.js 2>&1 && pm2 restart duijie 2>&1 && echo "DONE"', (err, stream) => {
          if (err) { console.error(err); conn.end(); return; }
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.stderr.on('data', d => process.stderr.write(d.toString()));
          stream.on('close', (code) => { console.log('\n[exit:', code + ']'); conn.end(); });
        });
        return;
      }

      const f = FILES_TO_UPLOAD[i];
      const localPath = path.join(BASE, f.local);
      const content = fs.readFileSync(localPath, 'utf8');
      sftp.writeFile(f.remote, content, (err) => {
        if (err) console.log(`  FAIL: ${f.local} -> ${err.message}`);
        else console.log(`  OK: ${f.local}`);
        i++;
        uploadNext();
      });
    }
    uploadNext();
  });
}).on('error', err => {
  console.error('SSH error:', err.message);
}).connect({ host: '160.202.253.143', port: 22, username: 'root', password: 'Xiao134679' });
