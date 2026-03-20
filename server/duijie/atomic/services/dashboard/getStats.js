const statsRepo = require('../../repositories/dashboard/statsRepo');

module.exports = async (auth) => {
  return await statsRepo(auth);
};
