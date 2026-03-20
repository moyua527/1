const updateRepo = require('../../repositories/contract/updateRepo');

module.exports = async (id, fields) => {
  await updateRepo(id, fields);
};
