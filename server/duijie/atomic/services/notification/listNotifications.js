const findByUserRepo = require('../../repositories/notification/findByUserRepo');

module.exports = async (userId, limit, category) => {
  return await findByUserRepo(userId, limit, category);
};
