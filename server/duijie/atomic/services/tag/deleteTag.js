const deleteRepo = require('../../repositories/tag/deleteRepo');

module.exports = async (id) => {
  await deleteRepo(id);
};
