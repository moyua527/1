const db = require('../../../config/db');

exports.getClientTags = async (clientId) => {
  const [rows] = await db.query(
    'SELECT t.* FROM duijie_tags t INNER JOIN duijie_client_tags ct ON t.id = ct.tag_id WHERE ct.client_id = ? ORDER BY t.name',
    [clientId]
  );
  return rows;
};

exports.setClientTags = async (clientId, tagIds) => {
  await db.query('DELETE FROM duijie_client_tags WHERE client_id = ?', [clientId]);
  if (tagIds && tagIds.length > 0) {
    const values = tagIds.map(tid => [clientId, tid]);
    await db.query('INSERT INTO duijie_client_tags (client_id, tag_id) VALUES ?', [values]);
  }
};
