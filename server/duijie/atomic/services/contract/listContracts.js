const findByClientRepo = require('../../repositories/contract/findByClientRepo');

module.exports = async (clientId) => {
  return await findByClientRepo(clientId);
};
