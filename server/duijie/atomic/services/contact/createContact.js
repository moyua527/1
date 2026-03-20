const createRepo = require('../../repositories/contact/createRepo');

module.exports = async (data) => {
  return await createRepo(data);
};
