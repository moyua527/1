const db = require('../config/db');
(async () => {
  try {
    await db.query('ALTER TABLE duijie_direct_messages ADD COLUMN is_recalled TINYINT(1) DEFAULT 0 AFTER read_at');
    console.log('Column is_recalled added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('Column already exists');
    else console.error(e.message);
  }
  process.exit(0);
})();
