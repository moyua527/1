module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ success: false, message: '无权限访问' });
    }
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: '角色权限不足' });
    }
    next();
  };
};
