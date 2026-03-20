const db = require('../../../config/db');

module.exports = async ({ name, color }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_tags (name, color) VALUES (?, ?)',
    [name, color || '#6b7280']
  );
  return result.insertId;
};
