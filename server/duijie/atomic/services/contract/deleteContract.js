const deleteRepo = require('../../repositories/contract/deleteRepo');

module.exports = async (id) => {
  await deleteRepo(id);
};
