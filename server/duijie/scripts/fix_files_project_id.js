const db = require('../config/db');
(async () => {
  try {
    await db.query('ALTER TABLE duijie_files MODIFY COLUMN project_id INT NULL');
    console.log('duijie_files.project_id changed to nullable');
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
})();
