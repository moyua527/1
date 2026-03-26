const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const enterprisePermGuard = require('../middleware/enterprisePermGuard');
const upload = require('./upload');
const router = express.Router();

const taskStaff = roleGuard('admin', 'tech', 'business', 'member', 'viewer');

// Tasks
router.post('/tasks', auth, roleGuard('admin', 'tech', 'business', { soft: true }), enterprisePermGuard('can_manage_task'), upload.array('files', 10), require('../controllers/task/createController'));
router.get('/tasks/export', auth, require('../controllers/task/exportController'));
router.get('/tasks', auth, require('../controllers/task/listController'));
router.put('/tasks/:id', auth, taskStaff, require('../controllers/task/updateController'));
router.patch('/tasks/:id/move', auth, taskStaff, require('../controllers/task/moveController'));
router.delete('/tasks/:id', auth, taskStaff, require('../controllers/task/deleteController'));
router.post('/tasks/:id/attachments', auth, taskStaff, upload.array('files', 10), require('../controllers/task/uploadAttachmentController'));
router.delete('/tasks/attachments/:attachmentId', auth, taskStaff, require('../controllers/task/deleteAttachmentController'));
router.get('/tasks/attachments/:attachmentId/download', auth, require('../controllers/task/downloadAttachmentController'));

// Milestones
router.post('/milestones', auth, require('../controllers/milestone/createController'));
router.get('/milestones', auth, require('../controllers/milestone/listController'));
router.put('/milestones/:id', auth, require('../controllers/milestone/updateController'));
router.delete('/milestones/:id', auth, require('../controllers/milestone/deleteController'));
router.patch('/milestones/:id/toggle', auth, require('../controllers/milestone/toggleController'));

// Files
router.post('/files/upload', auth, upload.single('file'), require('../controllers/file/uploadController'));
router.get('/files/all', auth, require('../controllers/file/listAllController'));
router.get('/files', auth, require('../controllers/file/listController'));
router.delete('/files/:id', auth, require('../controllers/file/deleteController'));
router.get('/files/:id/download', auth, require('../controllers/file/downloadController'));
router.get('/files/:id/preview', auth, require('../controllers/file/previewController'));

module.exports = router;
