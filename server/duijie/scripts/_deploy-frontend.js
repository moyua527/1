const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..', '..', '..', 'frontend', 'duijieReact', 'src');

const FILES = [
  'features/enterprise/constants.ts',
  'features/enterprise/RoleList.tsx',
  'features/enterprise/MemberList.tsx',
  'features/enterprise/index.tsx',
  'features/enterprise/useEnterprise.ts',
  'stores/permissions.tsx',
  'stores/useUserStore.ts',
];

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected, uploading frontend source...');
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err); conn.end(); return; }

    let i = 0;
    function uploadNext() {
      if (i >= FILES.length) {
        console.log('\nAll frontend files uploaded. Building...\n');
        conn.exec('cd /opt/duijie/frontend/duijieReact && npx vite build 2>&1 | tail -20', (err, stream) => {
          if (err) { console.error(err); conn.end(); return; }
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.stderr.on('data', d => process.stderr.write(d.toString()));
          stream.on('close', (code) => { console.log('\n[build exit:', code + ']'); conn.end(); });
        });
        return;
      }

      const f = FILES[i];
      const localPath = path.join(FRONTEND_DIR, f);
      const remotePath = '/opt/duijie/frontend/duijieReact/src/' + f;
      const content = fs.readFileSync(localPath, 'utf8');
      sftp.writeFile(remotePath, content, (err) => {
        if (err) console.log(`  FAIL: ${f} -> ${err.message}`);
        else console.log(`  OK: ${f}`);
        i++;
        uploadNext();
      });
    }
    uploadNext();
  });
}).on('error', err => {
  console.error('SSH error:', err.message);
}).connect({ host: '160.202.253.143', port: 22, username: 'root', password: 'Xiao134679' });
