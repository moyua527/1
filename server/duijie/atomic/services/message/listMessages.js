const findByProjectRepo = require('../../repositories/message/findByProjectRepo');

module.exports = async (project_id, options) => {
  return await findByProjectRepo(project_id, options);
};
