const xss = require('xss');

function sanitize(obj) {
  if (typeof obj === 'string') return xss(obj);
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) clean[k] = sanitize(v);
    return clean;
  }
  return obj;
}

module.exports = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = sanitize(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitize(req.query);
  next();
};
