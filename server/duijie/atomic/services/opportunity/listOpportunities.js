const findAllRepo = require('../../repositories/opportunity/findAllRepo');

module.exports = async (userId, userRole) => {
  return await findAllRepo(userId, userRole);
};
