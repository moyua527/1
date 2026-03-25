const findByUserRepo = require('../../repositories/notification/findByUserRepo');

module.exports = async (userId, limit) => {
  return await findByUserRepo(userId, limit);
};
