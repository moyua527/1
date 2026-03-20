const findByProjectRepo = require('../../repositories/task/findByProjectRepo');

module.exports = async (project_id, auth) => {
  return await findByProjectRepo(project_id, auth);
};
