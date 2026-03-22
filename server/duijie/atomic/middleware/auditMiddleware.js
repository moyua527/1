const { auditLog } = require('../utils/auditLog');

const AUDIT_ROUTES = {
  'POST /api/projects': { action: 'create', entityType: 'project' },
  'PUT /api/projects/:id': { action: 'update', entityType: 'project' },
  'DELETE /api/projects/:id': { action: 'delete', entityType: 'project' },
  'POST /api/tasks': { action: 'create', entityType: 'task' },
  'PUT /api/tasks/:id': { action: 'update', entityType: 'task' },
  'DELETE /api/tasks/:id': { action: 'delete', entityType: 'task' },
  'POST /api/clients': { action: 'create', entityType: 'client' },
  'PUT /api/clients/:id': { action: 'update', entityType: 'client' },
  'DELETE /api/clients/:id': { action: 'delete', entityType: 'client' },
  'POST /api/tickets': { action: 'create', entityType: 'ticket' },
  'POST /api/users': { action: 'create', entityType: 'user' },
  'PUT /api/users/:id': { action: 'update', entityType: 'user' },
  'DELETE /api/users/:id': { action: 'delete', entityType: 'user' },
  'POST /api/auth/login': { action: 'login', entityType: 'auth' },
  'POST /api/auth/logout': { action: 'logout', entityType: 'auth' },
};

function matchRoute(method, path) {
  for (const [pattern, config] of Object.entries(AUDIT_ROUTES)) {
    const [m, p] = pattern.split(' ');
    if (m !== method) continue;
    const regex = new RegExp('^' + p.replace(/:(\w+)/g, '(\\d+)') + '$');
    const match = path.match(regex);
    if (match) return { ...config, entityId: match[1] ? Number(match[1]) : null };
  }
  return null;
}

module.exports = (req, res, next) => {
  const original = res.json.bind(res);
  res.json = function (body) {
    if (body && body.success !== false) {
      const matched = matchRoute(req.method, req.path);
      if (matched) {
        const detail = matched.action === 'login'
          ? `用户 ${req.body?.username || ''} 登录`
          : matched.action === 'logout'
          ? '用户登出'
          : `${matched.action} ${matched.entityType}${matched.entityId ? ' #' + matched.entityId : ''}`;
        auditLog({
          userId: req.userId || null,
          username: req.username || req.body?.username || '',
          action: matched.action,
          entityType: matched.entityType,
          entityId: matched.entityId || body?.data?.id || null,
          detail,
          ip: req.ip || req.headers['x-forwarded-for'] || '',
        });
      }
    }
    return original(body);
  };
  next();
};
