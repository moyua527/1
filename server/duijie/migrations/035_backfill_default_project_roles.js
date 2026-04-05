/**
 * One-time migration: backfill default project roles for all existing projects.
 * Run after deploying the updated projectRoles.js.
 * Usage: cd /opt/duijie/server/duijie && node migrations/035_backfill_default_project_roles.js
 */
require('dotenv').config();
const db = require('../config/db');
const { ensureDefaultProjectRoles } = require('../atomic/utils/projectRoles');

(async () => {
  try {
    const [projects] = await db.query(
      'SELECT id, created_by FROM duijie_projects WHERE is_deleted = 0'
    );
    console.log(`Found ${projects.length} active projects`);

    let updated = 0;
    for (const p of projects) {
      const before = await db.query(
        'SELECT COUNT(*) as cnt FROM project_roles WHERE project_id = ? AND is_deleted = 0',
        [p.id]
      );
      const roles = await ensureDefaultProjectRoles(p.id, p.created_by);
      if (roles.length > before[0][0].cnt) {
        updated++;
        console.log(`  [+] Project ${p.id}: ${before[0][0].cnt} -> ${roles.length} roles`);
      }
    }
    console.log(`Done. ${updated} projects updated.`);
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
