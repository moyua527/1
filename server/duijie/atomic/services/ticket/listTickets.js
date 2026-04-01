const findAllRepo = require('../../repositories/ticket/findAllRepo');
const { getUserActiveEnterpriseId, getEnterpriseMemberUserIds, getUserScopedProjectIds } = require('../accessScope');

module.exports = async (userId, userRole) => {
  if (userRole === 'admin') return await findAllRepo();

  const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
  if (activeEnterpriseId) {
    const memberUserIds = await getEnterpriseMemberUserIds(activeEnterpriseId);
    const scopedProjectIds = await getUserScopedProjectIds(userId);
    return await findAllRepo({ memberUserIds, scopedProjectIds });
  }

  return await findAllRepo({ memberUserIds: [userId], scopedProjectIds: [] });
};
