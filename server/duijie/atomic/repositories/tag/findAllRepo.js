const db = require('../../../config/db');

module.exports = async () => {
  const [rows] = await db.query('SELECT * FROM duijie_tags ORDER BY name ASC');
  return rows;
};
