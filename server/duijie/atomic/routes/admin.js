const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const adminOnly = roleGuard('admin');

// Health check (public)
router.get('/health', async (req, res) => {
  const status = { status: 'ok', timestamp: new Date().toISOString(), version: require('../../package.json').version };
  try {
    const db = require('../../config/db');
    const [rows] = await db.query('SELECT 1 as ping');
    status.database = rows[0]?.ping === 1 ? 'connected' : 'error';
  } catch (e) {
    status.database = 'disconnected';
    status.status = 'degraded';
  }
  // 进程指标
  const mem = process.memoryUsage();
  status.memory = { rss: Math.round(mem.rss / 1024 / 1024) + 'MB', heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB' };
  status.uptime = Math.round(process.uptime()) + 's';
  // Socket.IO 连接数
  try { const { getStats } = require('../../socket'); status.websocket = getStats(); } catch (_) {}
  const code = status.status === 'ok' ? 200 : 503;
  res.status(code).json(status);
});

// System config
const configCtrl = require('../controllers/system/configController');
router.get('/system/invite-code', auth, configCtrl.get);
router.put('/system/invite-code', auth, configCtrl.update);
router.get('/system/config', auth, adminOnly, configCtrl.getAll);
router.put('/system/config', auth, adminOnly, configCtrl.updateAll);

// Global search
router.get('/search', auth, require('../controllers/search/searchController'));

// App version check
router.get('/app/version', require('../controllers/system/appVersionController'));

// App bundle (live update)
router.get('/app/bundle', require('../controllers/system/bundleController'));

// Dashboard
router.get('/dashboard/stats', auth, require('../controllers/dashboard/statsController'));
const enterprisePermGuard = require('../middleware/enterprisePermGuard');
router.get('/dashboard/report', auth, roleGuard('admin', 'member', { soft: true }), enterprisePermGuard('can_view_report'), require('../controllers/dashboard/reportController'));
router.get('/dashboard/chart', auth, require('../controllers/dashboard/chartController'));
router.get('/dashboard/workspace', auth, require('../controllers/dashboard/workspaceController'));

// Invite Links
router.post('/invite-links', auth, adminOnly, require('../controllers/invite/createController'));
router.get('/invite-links', auth, adminOnly, require('../controllers/invite/listController'));
router.get('/invite-links/:token/validate', require('../controllers/invite/validateController'));
router.delete('/invite-links/:id', auth, adminOnly, async (req, res) => {
  try {
    const db = require('../../config/db');
    await db.query('DELETE FROM duijie_invite_links WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Users (admin only)
router.get('/users', auth, adminOnly, require('../controllers/user/listController'));
router.post('/users', auth, adminOnly, V.createUser, validate, require('../controllers/user/createController'));
router.put('/users/:id', auth, adminOnly, V.updateUser, validate, require('../controllers/user/updateController'));
router.delete('/users/:id', auth, adminOnly, require('../controllers/user/deleteController'));

// Audit Logs (admin only)
router.get('/audit-logs', auth, adminOnly, require('../controllers/audit/listController'));

module.exports = router;
