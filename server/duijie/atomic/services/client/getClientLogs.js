const findLogsRepo = require('../../repositories/client/findLogsRepo');

module.exports = async (clientId) => {
  return await findLogsRepo(clientId);
};
