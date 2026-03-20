const updateRepo = require('../../repositories/client/updateRepo');
const findByIdRepo = require('../../repositories/client/findByIdRepo');
const createLogRepo = require('../../repositories/client/createLogRepo');

module.exports = async (id, fields, userId) => {
  const old = await findByIdRepo(id);
  if (!old) return;
  await updateRepo(id, fields);
  const loggable = ['name', 'company', 'email', 'phone', 'channel', 'stage', 'notes'];
  for (const key of loggable) {
    if (fields[key] !== undefined && String(fields[key] || '') !== String(old[key] || '')) {
      await createLogRepo({ client_id: id, field_name: key, old_value: old[key] || '', new_value: fields[key] || '', changed_by: userId || 0 });
    }
  }
};
