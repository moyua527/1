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
  const [rows] = await db.query('SELECT version, name FROM schema_migrations ORDER BY id');
  const applied = new Set();
  for (const row of rows) {
    if (row.name) {
      applied.add(row.name);
      applied.add(row.name.replace(/\.sql$/i, ''));
    }
    if (row.version && String(row.version).includes('_')) {
      applied.add(row.version);
    }
  }
  return applied;
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

function isIgnorableMigrationError(error) {
  const ignorableCodes = new Set([
    'ER_DUP_FIELDNAME',
    'ER_DUP_KEYNAME',
    'ER_CANT_DROP_FIELD_OR_KEY',
    'ER_TABLE_EXISTS_ERROR',
    'ER_BAD_FIELD_ERROR',
  ]);
  const ignorableErrnos = new Set([1060, 1061, 1091, 1050, 1054]);
  if (ignorableCodes.has(error?.code) || ignorableErrnos.has(error?.errno)) return true;
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('duplicate column name')
    || message.includes('duplicate key name')
    || message.includes("can't drop")
    || message.includes('check that column/key exists')
    || message.includes('table already exists')
    || message.includes('unknown column')
  );
}

async function run() {
  console.log('[migrate] Starting database migrations...');
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();
  let count = 0;

  for (const file of files) {
    const version = file.replace(/\.sql$/i, '');
    if (applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8').trim();
    if (!sql) continue;

    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);

    console.log(`  [${version}] ${file}`);
    const conn = await db.getConnection();
    try {
      for (const stmt of statements) {
        try {
          await conn.query(stmt);
        } catch (stmtError) {
          if (isIgnorableMigrationError(stmtError)) {
            console.log(`    [skip] ${stmtError.message}`);
            continue;
          }
          throw stmtError;
        }
      }
      await conn.query(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [version, file]
      );
      applied.add(file);
      applied.add(version);
      count++;
    } catch (e) {
      console.error(`  [FAIL] ${file}: ${e.message}`);
      conn.release();
      process.exit(1);
    }
    conn.release();
  }

  console.log(`[migrate] Done. ${count} new migration(s) applied.`);
  await db.end();
}

run().catch(e => {
  console.error('[migrate] Fatal:', e.message);
  process.exit(1);
});
