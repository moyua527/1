const findByIdRepo = require('../../repositories/project/findByIdRepo');

module.exports = async (id) => {
  return await findByIdRepo(id);
};
