const db = require('../../../config/db');
const { optimisticUpdate } = require('../../utils/optimisticLock');

module.exports = async (id, fields) => {
  const version = fields.version;
  const data = { ...fields };
  delete data.version;
  await optimisticUpdate(db, 'duijie_clients', id, data, version ?? null);
};
