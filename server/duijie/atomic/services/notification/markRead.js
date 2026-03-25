const markReadRepo = require('../../repositories/notification/markReadRepo');

module.exports = async (id, userId) => {
  await markReadRepo(id, userId);
};
