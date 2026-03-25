module.exports = (...allowedRoles) => {
  const opts = typeof allowedRoles[allowedRoles.length - 1] === 'object' ? allowedRoles.pop() : {};
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ success: false, message: '无权限访问' });
    }
    if (allowedRoles.includes(req.userRole)) {
      req._platformRolePassed = true;
      return next();
    }
    if (opts.soft) {
      req._platformRolePassed = false;
      return next();
    }
    return res.status(403).json({ success: false, message: '角色权限不足' });
  };
};
