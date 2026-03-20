const findByProjectRepo = require('../../repositories/file/findByProjectRepo');

module.exports = async (project_id) => {
  return await findByProjectRepo(project_id);
};
