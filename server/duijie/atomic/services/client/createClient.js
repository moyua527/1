const createRepo = require('../../repositories/client/createRepo');

module.exports = async (data) => {
  return await createRepo(data);
};
