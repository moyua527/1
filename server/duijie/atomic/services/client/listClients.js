const findAllRepo = require('../../repositories/client/findAllRepo');

module.exports = async (auth) => {
  return await findAllRepo(auth);
};
