const findByUserRepo = require('../../repositories/notification/findByUserRepo');

module.exports = async (userId, limit, category, offset = 0) => {
  return await findByUserRepo(userId, limit, category, offset);
};
