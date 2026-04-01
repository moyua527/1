const db = require('../../config/db');
const logger = require('../../config/logger');

/**
 * 在数据库事务中执行回调函数
 * 
 * 用法：
 *   const result = await withTransaction(async (conn) => {
 *     await conn.query('INSERT INTO ...', [...]);
 *     await conn.query('UPDATE ...', [...]);
 *     return { id: 1 };
 *   });
 * 
 * @param {Function} callback 接收 connection 参数的异步回调
 * @returns {*} 回调函数的返回值
 * @throws 回调中的任何错误都会触发 ROLLBACK
 */
async function withTransaction(callback) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    logger.error(`Transaction rolled back: ${err.message}`);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { withTransaction };
