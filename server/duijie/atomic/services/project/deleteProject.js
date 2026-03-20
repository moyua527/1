const softDeleteRepo = require('../../repositories/project/softDeleteRepo');

module.exports = async (id) => {
  await softDeleteRepo(id);
};
