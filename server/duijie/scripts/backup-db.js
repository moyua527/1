const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MYSQLDUMP = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DB = process.env.DB_NAME || 'voice_room_db';
const USER = process.env.DB_USER || 'root';
const PASS = process.env.DB_PASSWORD || '';
const HOST = process.env.DB_HOST || 'localhost';

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const filename = `${DB}_${ts}.sql`;
const filepath = path.join(BACKUP_DIR, filename);

const passArg = PASS ? `-p${PASS}` : '';
const cmd = `"${MYSQLDUMP}" -h ${HOST} -u ${USER} ${passArg} --databases ${DB} --routines --triggers > "${filepath}"`;

try {
  execSync(cmd, { shell: 'cmd.exe', stdio: 'pipe' });
  const size = (fs.statSync(filepath).size / 1024).toFixed(1);
  console.log(`[backup] ${filename} (${size} KB)`);

  // 保留最近 10 个备份
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .reverse();
  files.slice(10).forEach(f => {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
    console.log(`[backup] 已清理旧备份: ${f}`);
  });
} catch (e) {
  console.error('[backup] 失败:', e.message);
  process.exit(1);
}
