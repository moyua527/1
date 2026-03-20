const findByIdRepo = require('../../repositories/file/findByIdRepo');

module.exports = async (id) => {
  return await findByIdRepo(id);
};
