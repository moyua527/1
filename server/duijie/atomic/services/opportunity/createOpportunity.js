const createRepo = require('../../repositories/opportunity/createRepo');

module.exports = async (data) => {
  return await createRepo(data);
};
