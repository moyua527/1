const createRepo = require('../../repositories/milestone/createRepo');

module.exports = async (data) => {
  return await createRepo(data);
};
