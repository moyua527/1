const createRepo = require('../../repositories/followUp/createRepo');

module.exports = async (data) => {
  return await createRepo(data);
};
