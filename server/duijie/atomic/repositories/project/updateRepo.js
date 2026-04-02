const db = require('../../../config/db');
const { optimisticUpdate } = require('../../utils/optimisticLock');
const { normalizeTaskTitlePresets } = require('../../utils/taskTitlePresets');

module.exports = async (id, fields) => {
  const version = fields.version;
  const data = { ...fields };
  delete data.version;
  if (data.tags !== undefined) data.tags = JSON.stringify(data.tags);
  if (data.task_title_presets !== undefined) data.task_title_presets = JSON.stringify(normalizeTaskTitlePresets(data.task_title_presets));
  await optimisticUpdate(db, 'duijie_projects', id, data, version ?? null);
};
