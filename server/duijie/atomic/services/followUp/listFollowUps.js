const findByClientRepo = require('../../repositories/followUp/findByClientRepo');

module.exports = async (clientId) => {
  return await findByClientRepo(clientId);
};
