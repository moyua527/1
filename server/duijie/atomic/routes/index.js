const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const allStaff = roleGuard('admin', 'sales_manager', 'tech', 'business', 'marketing', 'support');
const salesTeam = roleGuard('admin', 'sales_manager', 'business', 'marketing');
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, Date.now() + '-' + decoded);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Auth (no auth middleware)
router.post('/auth/login', require('../controllers/auth/loginController'));
router.post('/auth/register', require('../controllers/auth/registerController'));
router.get('/auth/register-config', require('../controllers/auth/registerConfigController'));
router.post('/auth/logout', require('../controllers/auth/logoutController'));
router.get('/auth/me', auth, require('../controllers/auth/meController'));
router.put('/auth/profile', auth, require('../controllers/auth/profileController'));

// System config (admin)
const configCtrl = require('../controllers/system/configController');
router.get('/system/invite-code', auth, configCtrl.get);
router.put('/system/invite-code', auth, configCtrl.update);

// Dashboard
router.get('/dashboard/stats', auth, require('../controllers/dashboard/statsController'));
router.get('/dashboard/report', auth, require('../controllers/dashboard/reportController'));

// Projects
const projectManagers = roleGuard('admin', 'sales_manager');
const projectStaff = roleGuard('admin', 'sales_manager', 'business', 'tech', 'marketing', 'support', 'viewer', 'client');
const projectEditors = roleGuard('admin', 'sales_manager', 'business', 'tech');
router.post('/projects', auth, projectManagers, require('../controllers/project/createController'));
router.get('/projects', auth, projectStaff, require('../controllers/project/listController'));
router.get('/projects/:id', auth, projectStaff, require('../controllers/project/detailController'));
router.put('/projects/:id', auth, projectEditors, require('../controllers/project/updateController'));
router.delete('/projects/:id', auth, roleGuard('admin'), require('../controllers/project/deleteController'));
router.get('/projects/:id/available-users', auth, projectEditors, require('../controllers/project/availableUsersController'));
router.post('/projects/:id/members', auth, projectEditors, require('../controllers/project/addMemberController'));
router.delete('/projects/:id/members/:userId', auth, projectEditors, require('../controllers/project/removeMemberController'));

// Clients
router.get('/clients/available-members', auth, salesTeam, require('../controllers/client/availableMembersController'));
router.post('/clients', auth, salesTeam, require('../controllers/client/createController'));
router.get('/clients', auth, roleGuard('admin', 'sales_manager', 'business', 'marketing', 'support', 'viewer'), require('../controllers/client/listController'));
router.get('/clients/:id', auth, roleGuard('admin', 'sales_manager', 'business', 'marketing', 'support', 'viewer'), require('../controllers/client/detailController'));
router.put('/clients/:id', auth, salesTeam, require('../controllers/client/updateController'));
router.delete('/clients/:id', auth, roleGuard('admin'), require('../controllers/client/deleteController'));
router.post('/clients/import', auth, roleGuard('admin', 'sales_manager', 'marketing'), require('../controllers/client/importController'));
router.get('/clients/:id/logs', auth, salesTeam, require('../controllers/client/logsController'));
router.get('/clients/:id/score', auth, salesTeam, require('../controllers/client/scoreController'));
router.get('/client-scores', auth, salesTeam, require('../controllers/client/scoresController'));

// AI
router.get('/clients/:clientId/ai-suggestion', auth, salesTeam, require('../controllers/ai/suggestionController'));

// Contacts
router.post('/contacts', auth, salesTeam, require('../controllers/contact/createController'));
router.get('/clients/:clientId/contacts', auth, roleGuard('admin', 'sales_manager', 'business', 'marketing', 'support', 'viewer'), require('../controllers/contact/listController'));
router.put('/contacts/:id', auth, salesTeam, require('../controllers/contact/updateController'));
router.delete('/contacts/:id', auth, roleGuard('admin'), require('../controllers/contact/deleteController'));

// Tags
const clientTagsCtrl = require('../controllers/tag/clientTagsController');
router.post('/tags', auth, salesTeam, require('../controllers/tag/createController'));
router.get('/tags', auth, salesTeam, require('../controllers/tag/listController'));
router.delete('/tags/:id', auth, roleGuard('admin'), require('../controllers/tag/deleteController'));
router.get('/clients/:clientId/tags', auth, salesTeam, clientTagsCtrl.get);
router.put('/clients/:clientId/tags', auth, salesTeam, clientTagsCtrl.set);

// Contracts
router.post('/contracts', auth, roleGuard('admin', 'sales_manager', 'business'), require('../controllers/contract/createController'));
router.get('/clients/:clientId/contracts', auth, roleGuard('admin', 'sales_manager', 'business', 'support'), require('../controllers/contract/listController'));
router.put('/contracts/:id', auth, roleGuard('admin', 'sales_manager', 'business'), require('../controllers/contract/updateController'));
router.delete('/contracts/:id', auth, roleGuard('admin'), require('../controllers/contract/deleteController'));

// Follow-ups
router.post('/follow-ups', auth, salesTeam, require('../controllers/followUp/createController'));
router.get('/clients/:clientId/follow-ups', auth, roleGuard('admin', 'sales_manager', 'business', 'support', 'viewer'), require('../controllers/followUp/listController'));

// Opportunities
router.post('/opportunities', auth, roleGuard('admin', 'sales_manager', 'business'), require('../controllers/opportunity/createController'));
router.get('/opportunities', auth, roleGuard('admin', 'sales_manager', 'business', 'viewer'), require('../controllers/opportunity/listController'));
router.put('/opportunities/:id', auth, roleGuard('admin', 'sales_manager', 'business'), require('../controllers/opportunity/updateController'));
router.delete('/opportunities/:id', auth, roleGuard('admin'), require('../controllers/opportunity/deleteController'));

// Tasks (staff only, not viewer/client)
router.post('/tasks', auth, require('../controllers/task/createController'));
router.get('/tasks', auth, require('../controllers/task/listController'));
router.put('/tasks/:id', auth, require('../controllers/task/updateController'));
router.patch('/tasks/:id/move', auth, require('../controllers/task/moveController'));
router.delete('/tasks/:id', auth, require('../controllers/task/deleteController'));

// Milestones
router.post('/milestones', auth, require('../controllers/milestone/createController'));
router.get('/milestones', auth, require('../controllers/milestone/listController'));
router.patch('/milestones/:id/toggle', auth, require('../controllers/milestone/toggleController'));

// Files
router.post('/files/upload', auth, upload.single('file'), require('../controllers/file/uploadController'));
router.get('/files', auth, require('../controllers/file/listController'));
router.delete('/files/:id', auth, require('../controllers/file/deleteController'));
router.get('/files/:id/download', auth, require('../controllers/file/downloadController'));

// Messages
router.post('/messages', auth, require('../controllers/message/sendController'));
router.get('/messages', auth, require('../controllers/message/listController'));

// Direct Messages
router.get('/dm/conversations', auth, require('../controllers/dm/conversationsController'));
router.get('/dm/users', auth, require('../controllers/dm/usersController'));
router.get('/dm/:userId/history', auth, require('../controllers/dm/historyController'));
router.post('/dm/send', auth, require('../controllers/dm/sendController'));

// Tickets (all authenticated)
router.post('/tickets', auth, require('../controllers/ticket/createController'));
router.get('/tickets', auth, require('../controllers/ticket/listController'));
router.get('/tickets/:id', auth, require('../controllers/ticket/detailController'));
router.put('/tickets/:id', auth, require('../controllers/ticket/updateController'));
router.post('/tickets/:id/reply', auth, require('../controllers/ticket/replyController'));
router.post('/tickets/:id/rate', auth, require('../controllers/ticket/rateController'));

// Admin guard
const adminOnly = roleGuard('admin');

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
router.post('/users', auth, adminOnly, require('../controllers/user/createController'));
router.put('/users/:id', auth, adminOnly, require('../controllers/user/updateController'));
router.delete('/users/:id', auth, adminOnly, require('../controllers/user/deleteController'));

module.exports = router;
