const listProjects = require('../../services/project/listProjects');

module.exports = async (req, res) => {
  try {
    const auth = { role: req.userRole, userId: req.userId, clientId: req.clientId };
    console.log('[project/list] auth:', JSON.stringify(auth), 'query:', JSON.stringify(req.query));
    const data = await listProjects(req.query, auth);
    console.log('[project/list] result: total=', data.total, 'rows=', data.rows?.length);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[project/list] ERROR:', e.message, e.stack);
    res.status(500).json({ success: false, message: e.message });
  }
};
