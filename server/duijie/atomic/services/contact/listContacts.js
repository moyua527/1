const findByClientRepo = require('../../repositories/contact/findByClientRepo');

module.exports = async (clientId) => {
  return await findByClientRepo(clientId);
};
