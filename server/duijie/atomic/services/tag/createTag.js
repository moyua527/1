const createRepo = require('../../repositories/tag/createRepo');

module.exports = async (data) => {
  return await createRepo(data);
};
