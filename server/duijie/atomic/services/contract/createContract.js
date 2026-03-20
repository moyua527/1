const createRepo = require('../../repositories/contract/createRepo');

module.exports = async (data) => {
  return await createRepo(data);
};
