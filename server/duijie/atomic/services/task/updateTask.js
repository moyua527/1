const updateRepo = require('../../repositories/task/updateRepo');

module.exports = async (id, fields) => {
  await updateRepo(id, fields);
};
