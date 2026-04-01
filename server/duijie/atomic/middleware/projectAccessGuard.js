const { getProjectAccessStatus } = require('../services/accessScope');

module.exports = ({ projectIdParam = 'id' } = {}) => {
  return async (req, res, next) => {
    try {
      const status = await getProjectAccessStatus(req.userId, req.userRole, req.params?.[projectIdParam]);
      if (status === 'missing') {
        return res.status(404).json({ success: false, message: '项目不存在' });
      }
      if (status !== 'allowed') {
        return res.status(403).json({ success: false, message: '无权访问此项目' });
      }
      return next();
    } catch (e) {
      return res.status(403).json({ success: false, message: '无权访问此项目' });
    }
  };
};
