const db = require('../../../config/db');

module.exports = async ({ client_id, field_name, old_value, new_value, changed_by }) => {
  await db.query(
    'INSERT INTO duijie_client_logs (client_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?)',
    [client_id, field_name, old_value, new_value, changed_by]
  );
};
