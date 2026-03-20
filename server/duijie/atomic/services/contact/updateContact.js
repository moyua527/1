const updateRepo = require('../../repositories/contact/updateRepo');

module.exports = async (id, fields) => {
  await updateRepo(id, fields);
};
