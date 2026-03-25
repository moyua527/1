const findUsersRepo = require('../../repositories/dm/findUsersRepo');

module.exports = async (excludeUserId) => {
  return await findUsersRepo(excludeUserId);
};
