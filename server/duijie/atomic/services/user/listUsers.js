const findAllRepo = require('../../repositories/user/findAllRepo');

module.exports = async () => {
  return await findAllRepo();
};
