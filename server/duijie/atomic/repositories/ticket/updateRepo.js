const db = require('../../../config/db');
const { optimisticUpdate } = require('../../utils/optimisticLock');

module.exports = async (ticketId, fieldsOrObject, params) => {
  // 兼容新旧两种调用方式
  if (Array.isArray(fieldsOrObject)) {
    // 旧方式: (id, ['status = ?'], [value])
    params.push(ticketId);
    await db.query(`UPDATE duijie_tickets SET ${fieldsOrObject.join(', ')}, version = version + 1 WHERE id = ? AND is_deleted = 0`, params);
  } else {
    // 新方式: (id, { field: value, version: n })
    const version = fieldsOrObject.version;
    const data = { ...fieldsOrObject };
    delete data.version;
    await optimisticUpdate(db, 'duijie_tickets', ticketId, data, version ?? null);
  }
};
