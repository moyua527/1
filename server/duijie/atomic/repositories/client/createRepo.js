const db = require('../../../config/db');

module.exports = async ({ user_id, name, company, email, phone, channel, stage, avatar, notes, position_level, department, job_function, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_clients (user_id, name, company, email, phone, channel, stage, avatar, notes, position_level, department, job_function, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [user_id || null, name, company, email, phone, channel, stage || 'potential', avatar, notes, position_level || null, department || null, job_function || null, created_by]
  );
  return result.insertId;
};
