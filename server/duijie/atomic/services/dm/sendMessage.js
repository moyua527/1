const createMessageRepo = require('../../repositories/dm/createMessageRepo');

module.exports = async (senderId, receiverId, content) => {
  const insertId = await createMessageRepo(senderId, receiverId, content);
  return insertId;
};
