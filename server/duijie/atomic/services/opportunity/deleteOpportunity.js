const softDeleteRepo = require('../../repositories/opportunity/softDeleteRepo');

module.exports = async (id) => {
  await softDeleteRepo(id);
};
