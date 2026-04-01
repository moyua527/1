const findByIdRepo = require('../../repositories/project/findByIdRepo');
const { hasExternalEnterprise } = require('../accessScope');

module.exports = async (id) => {
  const project = await findByIdRepo(id);
  if (!project) return null;
  return { ...project, has_external_enterprise: hasExternalEnterprise(project) };
};
