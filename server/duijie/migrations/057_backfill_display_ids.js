const db = require('../../config/db');

async function run() {
  console.log('[backfill] Starting display_id backfill...');

  // Backfill enterprise display_ids
  const [enterprises] = await db.query(
    "SELECT id FROM duijie_clients WHERE display_id IS NULL AND is_deleted = 0 ORDER BY id ASC"
  );
  for (let i = 0; i < enterprises.length; i++) {
    const displayId = 'q' + String(i + 1).padStart(6, '0');
    await db.query("UPDATE duijie_clients SET display_id = ? WHERE id = ?", [displayId, enterprises[i].id]);
  }
  console.log(`[backfill] ${enterprises.length} enterprise(s) updated`);

  // Backfill project display_ids
  const [projects] = await db.query(
    "SELECT p.id, p.client_id, c.display_id as ent_display_id FROM duijie_projects p LEFT JOIN duijie_clients c ON c.id = p.client_id WHERE p.display_id IS NULL AND p.is_deleted = 0 ORDER BY p.id ASC"
  );

  const entCounters = {};
  let personalSeq = 0;

  for (const proj of projects) {
    let displayId;
    if (proj.ent_display_id) {
      const entShort = proj.ent_display_id.substring(1).slice(-3);
      if (!entCounters[entShort]) entCounters[entShort] = 0;
      entCounters[entShort]++;
      displayId = 'x' + entShort + String(entCounters[entShort]).padStart(6, '0');
    } else {
      personalSeq++;
      displayId = 'x' + String(personalSeq).padStart(8, '0');
    }
    await db.query("UPDATE duijie_projects SET display_id = ? WHERE id = ?", [displayId, proj.id]);
  }
  console.log(`[backfill] ${projects.length} project(s) updated`);
  console.log('[backfill] Done.');
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = run;
