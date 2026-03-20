const db = require('../../../config/db');

module.exports = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM duijie_files WHERE id = ? AND is_deleted = 0',
    [id]
  );
  return rows[0] || null;
};
