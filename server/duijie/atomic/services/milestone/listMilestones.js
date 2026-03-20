const findByProjectRepo = require('../../repositories/milestone/findByProjectRepo');

module.exports = async (project_id) => {
  return await findByProjectRepo(project_id);
};
