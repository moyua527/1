const bcrypt = require('bcryptjs');
const updateRepo = require('../../repositories/user/updateRepo');

module.exports = async (id, { nickname, role, client_id, manager_id, password, is_active }) => {
  const fields = [];
  const values = [];
  if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
  if (role !== undefined) { fields.push('role = ?'); values.push(role); }
  if (client_id !== undefined) { fields.push('client_id = ?'); values.push(client_id || null); }
  if (manager_id !== undefined) { fields.push('manager_id = ?'); values.push(manager_id || null); }
  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
  if (password) { fields.push('password = ?'); values.push(await bcrypt.hash(password, 10)); }

  if (fields.length === 0) return { empty: true };

  await updateRepo(id, fields, values);
  return { updated: true };
};
