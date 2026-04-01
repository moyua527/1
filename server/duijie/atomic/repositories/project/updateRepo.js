const db = require('../../../config/db');
const { optimisticUpdate } = require('../../utils/optimisticLock');

module.exports = async (id, fields) => {
  const version = fields.version;
  const data = { ...fields };
  delete data.version;
  if (data.tags !== undefined) data.tags = JSON.stringify(data.tags);
  await optimisticUpdate(db, 'duijie_projects', id, data, version ?? null);
};
