const { getClientAccessStatus, resolveClientIdFromResource } = require('../services/accessScope');

function sendStatus(res, status) {
  if (status === 'missing') {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  return res.status(403).json({ success: false, message: '无权访问此客户' });
}

module.exports = ({
  clientIdParam = 'id',
  clientIdBodyField = null,
  resourceType = null,
  resourceIdParam = 'id',
  attachKey = null,
} = {}) => {
  return async (req, res, next) => {
    try {
      let clientId = req.params?.[clientIdParam];
      if (clientIdBodyField && req.body?.[clientIdBodyField] !== undefined) {
        clientId = req.body[clientIdBodyField];
      }
      if (resourceType) {
        clientId = await resolveClientIdFromResource(resourceType, req.params?.[resourceIdParam]);
        if (attachKey) req[attachKey] = clientId;
      }
      const status = await getClientAccessStatus(req.userId, req.userRole, clientId);
      if (status !== 'allowed') return sendStatus(res, status);
      return next();
    } catch (e) {
      return res.status(403).json({ success: false, message: '无权访问此客户' });
    }
  };
};
