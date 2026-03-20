const softDeleteRepo = require('../../repositories/client/softDeleteRepo');

module.exports = async (id) => {
  await softDeleteRepo(id);
};
