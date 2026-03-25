const findHistoryRepo = require('../../repositories/dm/findHistoryRepo');
const markReadRepo = require('../../repositories/dm/markReadRepo');

module.exports = async (uid, otherId) => {
  const rows = await findHistoryRepo(uid, otherId);
  await markReadRepo(otherId, uid);
  return rows;
};
