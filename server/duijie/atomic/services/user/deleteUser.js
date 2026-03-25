const softDeleteRepo = require('../../repositories/user/softDeleteRepo');

module.exports = async (id) => {
  await softDeleteRepo(id);
};
