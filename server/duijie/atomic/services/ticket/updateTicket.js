const updateRepo = require('../../repositories/ticket/updateRepo');

module.exports = async (ticketId, { status, assigned_to, priority }) => {
  const fields = [];
  const params = [];
  if (status) { fields.push('status = ?'); params.push(status); if (status === 'resolved') { fields.push('resolved_at = NOW()'); } }
  if (assigned_to !== undefined) { fields.push('assigned_to = ?'); params.push(assigned_to || null); }
  if (priority) { fields.push('priority = ?'); params.push(priority); }
  if (fields.length === 0) return { empty: true };
  await updateRepo(ticketId, fields, params);
  return { empty: false };
};
