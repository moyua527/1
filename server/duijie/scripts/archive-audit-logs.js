/**
 * 审计日志手动归档脚本
 * 用法: node scripts/archive-audit-logs.js [天数]
 * 默认归档 90 天前的记录
 */
const db = require('../config/db');

async function archiveAuditLogs(days = 90) {
  console.log(`开始归档 ${days} 天前的审计日志...`);

  // 确保归档表存在
  await db.query('CREATE TABLE IF NOT EXISTS duijie_audit_logs_archive LIKE duijie_audit_logs');

  // 统计待归档记录
  const [[{ count }]] = await db.query(
    'SELECT COUNT(*) as count FROM duijie_audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [days]
  );
  console.log(`待归档记录数: ${count}`);

  if (count === 0) {
    console.log('没有需要归档的记录');
    process.exit(0);
  }

  // 分批归档（每批 5000 条，避免长事务）
  const batchSize = 5000;
  let archived = 0;

  while (archived < count) {
    await db.query(`
      INSERT INTO duijie_audit_logs_archive
      SELECT * FROM duijie_audit_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      LIMIT ?
    `, [days, batchSize]);

    const [result] = await db.query(`
      DELETE FROM duijie_audit_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      LIMIT ?
    `, [days, batchSize]);

    archived += result.affectedRows;
    console.log(`已归档 ${archived}/${count} 条`);

    if (result.affectedRows === 0) break;
  }

  console.log(`归档完成，共 ${archived} 条记录`);
  process.exit(0);
}

const days = parseInt(process.argv[2]) || 90;
archiveAuditLogs(days).catch(e => {
  console.error('归档失败:', e.message);
  process.exit(1);
});
