const updateRepo = require('../../repositories/opportunity/updateRepo');

module.exports = async (id, fields) => {
  await updateRepo(id, fields);
};
