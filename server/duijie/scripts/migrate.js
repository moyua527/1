require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations() {
  const [rows] = await db.query('SELECT version FROM schema_migrations ORDER BY version');
  return new Set(rows.map(r => r.version));
}

async function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations directory found');
    return [];
  }
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files;
}

async function run() {
  console.log('[migrate] Starting database migrations...');
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();
  let count = 0;

  for (const file of files) {
    const version = file.replace('.sql', '').split('_')[0];
    if (applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8').trim();
    if (!sql) continue;

    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);

    console.log(`  [${version}] ${file}`);
    const conn = await db.getConnection();
    try {
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      await conn.query(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [version, file]
      );
      count++;
    } catch (e) {
      console.error(`  [FAIL] ${file}: ${e.message}`);
      conn.release();
      process.exit(1);
    }
    conn.release();
  }

  console.log(`[migrate] Done. ${count} new migration(s) applied, ${applied.size} already applied.`);
  await db.end();
}

run().catch(e => {
  console.error('[migrate] Fatal:', e.message);
  process.exit(1);
});
