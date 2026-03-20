const findAllRepo = require('../../repositories/project/findAllRepo');

module.exports = async (query, auth) => {
  return await findAllRepo(query, auth);
};
