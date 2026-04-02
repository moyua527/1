/**
 * 基于 MySQL 的 express-rate-limit Store
 * 替代默认的内存存储，PM2 重启不丢失限流状态
 */
const db = require('../../config/db');
const logger = require('../../config/logger');

class MySQLRateLimitStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
  }

  async increment(key) {
    const now = Date.now();
    const resetTime = now + this.windowMs;

    try {
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE 实现原子操作
      await db.query(
        `INSERT INTO rate_limit_store (\`key\`, total_hits, reset_time) VALUES (?, 1, ?)
         ON DUPLICATE KEY UPDATE
           total_hits = IF(reset_time <= ?, 1, total_hits + 1),
           reset_time = IF(reset_time <= ?, ?, reset_time)`,
        [key, resetTime, now, now, resetTime]
      );

      const [[row]] = await db.query(
        'SELECT total_hits, reset_time FROM rate_limit_store WHERE `key` = ?',
        [key]
      );

      if (!row) return { totalHits: 1, resetTime: new Date(resetTime) };

      return {
        totalHits: row.total_hits,
        resetTime: new Date(row.reset_time),
      };
    } catch (e) {
      logger.error(`MySQLRateLimitStore.increment error: ${e.message}`);
      // 降级：返回默认值，不阻止请求
      return { totalHits: 0, resetTime: new Date(now + this.windowMs) };
    }
  }

  async decrement(key) {
    try {
      await db.query(
        'UPDATE rate_limit_store SET total_hits = GREATEST(total_hits - 1, 0) WHERE `key` = ?',
        [key]
      );
    } catch (e) {
      logger.error(`MySQLRateLimitStore.decrement error: ${e.message}`);
    }
  }

  async resetKey(key) {
    try {
      await db.query('DELETE FROM rate_limit_store WHERE `key` = ?', [key]);
    } catch (e) {
      logger.error(`MySQLRateLimitStore.resetKey error: ${e.message}`);
    }
  }

  async resetAll() {
    try {
      await db.query('TRUNCATE TABLE rate_limit_store');
    } catch (e) {
      logger.error(`MySQLRateLimitStore.resetAll error: ${e.message}`);
    }
  }
}

module.exports = MySQLRateLimitStore;
