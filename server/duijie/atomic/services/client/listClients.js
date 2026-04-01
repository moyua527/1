const findAllRepo = require('../../repositories/client/findAllRepo');
const { getUserActiveEnterpriseId } = require('../accessScope');

module.exports = async (auth) => {
  const enterpriseId = await getUserActiveEnterpriseId(auth.userId);
  return await findAllRepo({ ...auth, excludeEnterpriseId: enterpriseId });
};
