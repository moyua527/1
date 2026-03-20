const findByIdRepo = require('../../repositories/client/findByIdRepo');

module.exports = async (id) => {
  return await findByIdRepo(id);
};
