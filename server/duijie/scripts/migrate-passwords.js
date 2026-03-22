const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [users] = await db.query('SELECT id, username, password FROM voice_users WHERE password NOT LIKE "$2a$%" AND password NOT LIKE "$2b$%"');
  console.log(`Found ${users.length} plaintext passwords to migrate`);
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await db.query('UPDATE voice_users SET password = ? WHERE id = ?', [hashed, u.id]);
    console.log(`  Migrated user #${u.id} (${u.username})`);
  }
  await db.end();
  console.log('Password migration complete');
})();
