const db = require('../config/db');
const { notify } = require('../atomic/utils/notify');
const logger = require('../config/logger');

async function checkReminders() {
  try {
    const [rows] = await db.query(
      `SELECT r.*, m.title AS milestone_title, m.project_id
       FROM duijie_milestone_reminders r
       JOIN duijie_milestones m ON m.id = r.milestone_id AND m.is_deleted = 0
       WHERE r.is_sent = 0 AND r.remind_at <= NOW()
       LIMIT 50`
    );
    for (const r of rows) {
      const noteStr = r.note ? ` — ${r.note}` : '';
      await notify(
        r.user_id,
        'follow_reminder',
        '代办跟进提醒',
        `代办「${r.milestone_title}」需要跟进${noteStr}`,
        `/projects/${r.project_id}?tab=milestones`
      );
      await db.query('UPDATE duijie_milestone_reminders SET is_sent = 1 WHERE id = ?', [r.id]);
    }
    if (rows.length) logger.info(`milestone reminder: sent ${rows.length} notifications`);
  } catch (e) {
    logger.error('milestone reminder check error:', e.message);
  }
}

let timer;
function start(intervalMs = 60000) {
  checkReminders();
  timer = setInterval(checkReminders, intervalMs);
  logger.info('milestone reminder job started');
}
function stop() { if (timer) clearInterval(timer); }

module.exports = { start, stop, checkReminders };
