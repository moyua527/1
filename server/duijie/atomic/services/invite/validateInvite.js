const findByTokenRepo = require('../../repositories/invite/findByTokenRepo');

module.exports = async (token) => {
  return await findByTokenRepo(token);
};
