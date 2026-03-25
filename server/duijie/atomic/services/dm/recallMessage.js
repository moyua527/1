const findMessageRepo = require('../../repositories/dm/findMessageRepo');
const recallMessageRepo = require('../../repositories/dm/recallMessageRepo');

async function findMessage(msgId) {
  return await findMessageRepo(msgId);
}

async function recall(msgId) {
  await recallMessageRepo(msgId);
}

module.exports = { findMessage, recall };
