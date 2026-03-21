const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const allStaff = roleGuard('admin', 'tech', 'business');
const clientStaff = roleGuard('admin', 'business');
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
router.post('/projects', auth, require('../controllers/project/createController'));
router.get('/projects', auth, require('../controllers/project/listController'));
router.get('/projects/:id', auth, require('../controllers/project/detailController'));
router.put('/projects/:id', auth, require('../controllers/project/updateController'));
router.delete('/projects/:id', auth, require('../controllers/project/deleteController'));

// Clients (admin/member only)
router.get('/clients/available-members', auth, clientStaff, require('../controllers/client/availableMembersController'));
router.post('/clients', auth, clientStaff, require('../controllers/client/createController'));
router.get('/clients', auth, clientStaff, require('../controllers/client/listController'));
router.get('/clients/:id', auth, clientStaff, require('../controllers/client/detailController'));
router.put('/clients/:id', auth, clientStaff, require('../controllers/client/updateController'));
router.delete('/clients/:id', auth, clientStaff, require('../controllers/client/deleteController'));
router.post('/clients/import', auth, clientStaff, require('../controllers/client/importController'));
router.get('/clients/:id/logs', auth, clientStaff, require('../controllers/client/logsController'));
router.get('/clients/:id/score', auth, clientStaff, require('../controllers/client/scoreController'));
router.get('/client-scores', auth, clientStaff, require('../controllers/client/scoresController'));

// AI (admin/member only)
router.get('/clients/:clientId/ai-suggestion', auth, clientStaff, require('../controllers/ai/suggestionController'));

// Contacts (admin/member only)
router.post('/contacts', auth, clientStaff, require('../controllers/contact/createController'));
router.get('/clients/:clientId/contacts', auth, clientStaff, require('../controllers/contact/listController'));
router.put('/contacts/:id', auth, clientStaff, require('../controllers/contact/updateController'));
router.delete('/contacts/:id', auth, clientStaff, require('../controllers/contact/deleteController'));

// Tags (admin/member only)
const clientTagsCtrl = require('../controllers/tag/clientTagsController');
router.post('/tags', auth, clientStaff, require('../controllers/tag/createController'));
router.get('/tags', auth, clientStaff, require('../controllers/tag/listController'));
router.delete('/tags/:id', auth, clientStaff, require('../controllers/tag/deleteController'));
router.get('/clients/:clientId/tags', auth, clientStaff, clientTagsCtrl.get);
router.put('/clients/:clientId/tags', auth, clientStaff, clientTagsCtrl.set);

// Contracts (admin/member only)
router.post('/contracts', auth, clientStaff, require('../controllers/contract/createController'));
router.get('/clients/:clientId/contracts', auth, clientStaff, require('../controllers/contract/listController'));
router.put('/contracts/:id', auth, clientStaff, require('../controllers/contract/updateController'));
router.delete('/contracts/:id', auth, clientStaff, require('../controllers/contract/deleteController'));

// Follow-ups (admin/member only)
router.post('/follow-ups', auth, clientStaff, require('../controllers/followUp/createController'));
router.get('/clients/:clientId/follow-ups', auth, clientStaff, require('../controllers/followUp/listController'));

// Tasks (all authenticated users)
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

// Users (admin only)
const adminOnly = roleGuard('admin');
router.get('/users', auth, adminOnly, require('../controllers/user/listController'));
router.post('/users', auth, adminOnly, require('../controllers/user/createController'));
router.put('/users/:id', auth, adminOnly, require('../controllers/user/updateController'));
router.delete('/users/:id', auth, adminOnly, require('../controllers/user/deleteController'));

module.exports = router;
