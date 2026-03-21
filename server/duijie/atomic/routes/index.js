const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const staff = roleGuard('admin', 'member');
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
router.post('/clients', auth, staff, require('../controllers/client/createController'));
router.get('/clients', auth, staff, require('../controllers/client/listController'));
router.get('/clients/:id', auth, staff, require('../controllers/client/detailController'));
router.put('/clients/:id', auth, staff, require('../controllers/client/updateController'));
router.delete('/clients/:id', auth, staff, require('../controllers/client/deleteController'));
router.post('/clients/import', auth, staff, require('../controllers/client/importController'));
router.get('/clients/:id/logs', auth, staff, require('../controllers/client/logsController'));
router.get('/clients/:id/score', auth, staff, require('../controllers/client/scoreController'));
router.get('/client-scores', auth, staff, require('../controllers/client/scoresController'));

// AI (admin/member only)
router.get('/clients/:clientId/ai-suggestion', auth, staff, require('../controllers/ai/suggestionController'));

// Contacts (admin/member only)
router.post('/contacts', auth, staff, require('../controllers/contact/createController'));
router.get('/clients/:clientId/contacts', auth, staff, require('../controllers/contact/listController'));
router.put('/contacts/:id', auth, staff, require('../controllers/contact/updateController'));
router.delete('/contacts/:id', auth, staff, require('../controllers/contact/deleteController'));

// Tags (admin/member only)
const clientTagsCtrl = require('../controllers/tag/clientTagsController');
router.post('/tags', auth, staff, require('../controllers/tag/createController'));
router.get('/tags', auth, staff, require('../controllers/tag/listController'));
router.delete('/tags/:id', auth, staff, require('../controllers/tag/deleteController'));
router.get('/clients/:clientId/tags', auth, staff, clientTagsCtrl.get);
router.put('/clients/:clientId/tags', auth, staff, clientTagsCtrl.set);

// Contracts (admin/member only)
router.post('/contracts', auth, staff, require('../controllers/contract/createController'));
router.get('/clients/:clientId/contracts', auth, staff, require('../controllers/contract/listController'));
router.put('/contracts/:id', auth, staff, require('../controllers/contract/updateController'));
router.delete('/contracts/:id', auth, staff, require('../controllers/contract/deleteController'));

// Follow-ups (admin/member only)
router.post('/follow-ups', auth, staff, require('../controllers/followUp/createController'));
router.get('/clients/:clientId/follow-ups', auth, staff, require('../controllers/followUp/listController'));

// Tasks (admin/member only)
router.post('/tasks', auth, staff, require('../controllers/task/createController'));
router.get('/tasks', auth, staff, require('../controllers/task/listController'));
router.put('/tasks/:id', auth, staff, require('../controllers/task/updateController'));
router.patch('/tasks/:id/move', auth, staff, require('../controllers/task/moveController'));

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
