const AppError = require('./AppError');

/**
 * 乐观锁更新工具
 * 自动将 version 检查加入 UPDATE 语句
 * 如果 affectedRows === 0 则抛出版本冲突错误
 *
 * @param {object} db - 数据库连接池
 * @param {string} table - 表名
 * @param {number} id - 记录ID
 * @param {object} fields - 要更新的字段
 * @param {number|null} expectedVersion - 客户端提供的版本号，null时跳过版本检查
 * @param {object} [opts] - 选项
 * @param {boolean} [opts.softDelete=true] - 是否加 is_deleted = 0 条件
 * @param {string[]} [opts.whitelist] - 允许更新的字段白名单，null表示不限制
 * @returns {Promise<void>}
 */
async function optimisticUpdate(db, table, id, fields, expectedVersion, opts = {}) {
  const { softDelete = true, whitelist = null } = opts;

  let keys = Object.keys(fields).filter(k => fields[k] !== undefined && k !== 'version');
  if (whitelist) {
    keys = keys.filter(k => whitelist.includes(k));
  }
  if (!keys.length) return;

  const sets = keys.map(k => `${k} = ?`);
  const vals = keys.map(k => fields[k]);

  // 始终递增 version
  sets.push('version = version + 1');

  let sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`;
  vals.push(id);

  if (expectedVersion !== null && expectedVersion !== undefined) {
    sql += ' AND version = ?';
    vals.push(expectedVersion);
  }

  if (softDelete) {
    sql += ' AND is_deleted = 0';
  }

  const [result] = await db.query(sql, vals);

  if (expectedVersion !== null && expectedVersion !== undefined && result.affectedRows === 0) {
    throw AppError.versionConflict();
  }
}

module.exports = { optimisticUpdate };
