const createRepo = require('../../repositories/invite/createRepo');

module.exports = async ({ token, preset_role, created_by, expires_at, note }) => {
  const id = await createRepo({ token, preset_role, created_by, expires_at, note });
  return id;
};
