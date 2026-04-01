const findAllRepo = require('../../repositories/contact/findAllRepo');

module.exports = async (auth = {}) => {
  return await findAllRepo(auth);
};
