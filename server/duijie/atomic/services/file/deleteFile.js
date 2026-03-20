const deleteRepo = require('../../repositories/file/deleteRepo');

module.exports = async (id) => {
  await deleteRepo(id);
};
