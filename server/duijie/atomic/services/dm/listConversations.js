const findConversationsRepo = require('../../repositories/dm/findConversationsRepo');

module.exports = async (uid) => {
  return await findConversationsRepo(uid);
};
