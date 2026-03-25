const db = require('../../../config/db');

module.exports = async ({ title, client_id, amount, probability, stage, expected_close, assigned_to, notes, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_opportunities (title, client_id, amount, probability, stage, expected_close, assigned_to, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, client_id || null, amount || 0, probability || 50, stage || 'lead', expected_close || null, assigned_to || null, notes || null, created_by]
  );
  return result.insertId;
};
