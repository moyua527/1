const deleteRepo = require('../../repositories/contact/deleteRepo');

module.exports = async (id) => {
  await deleteRepo(id);
};
