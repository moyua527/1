const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const enterprisePermGuard = require('../middleware/enterprisePermGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const upload = require('./upload');
const router = express.Router();

const taskStaff = roleGuard('admin', 'member');
const reviewPoints = require('../controllers/task/reviewPointsController');

// Tasks
router.post('/tasks', auth, roleGuard('admin', 'member', { soft: true }), enterprisePermGuard('can_create_task'), upload.array('files', 10), require('../controllers/task/createController'));
router.get('/tasks/export', auth, require('../controllers/task/exportController'));
router.get('/tasks/trash', auth, taskStaff, require('../controllers/task/trashController'));
router.get('/tasks', auth, require('../controllers/task/listController'));
router.put('/tasks/:id', auth, taskStaff, require('../controllers/task/updateController'));
router.patch('/tasks/:id/move', auth, taskStaff, require('../controllers/task/moveController'));
router.delete('/tasks/:id', auth, taskStaff, require('../controllers/task/deleteController'));
router.patch('/tasks/:id/restore', auth, taskStaff, require('../controllers/task/restoreController'));
router.post('/tasks/:id/attachments', auth, taskStaff, upload.array('files', 10), require('../controllers/task/uploadAttachmentController'));
router.delete('/tasks/attachments/:attachmentId', auth, taskStaff, require('../controllers/task/deleteAttachmentController'));
router.get('/tasks/attachments/:attachmentId/download', auth, require('../controllers/task/downloadAttachmentController'));

// 审核要点
router.get('/tasks/:id/review-points', auth, reviewPoints.list);
router.post('/tasks/:id/review-points', auth, taskStaff, reviewPoints.add);
router.put('/tasks/review-points/:pointId/respond', auth, taskStaff, reviewPoints.respond);
router.put('/tasks/review-points/:pointId/confirm', auth, taskStaff, reviewPoints.confirm);

// Milestones
router.post('/milestones', auth, V.createMilestone, validate, require('../controllers/milestone/createController'));
router.get('/milestones', auth, require('../controllers/milestone/listController'));
router.put('/milestones/:id', auth, V.updateMilestone, validate, require('../controllers/milestone/updateController'));
router.delete('/milestones/:id', auth, require('../controllers/milestone/deleteController'));
router.patch('/milestones/:id/toggle', auth, require('../controllers/milestone/toggleController'));
router.get('/milestones/:id/detail', auth, require('../controllers/milestone/detailController'));
router.post('/milestones/:id/progress', auth, require('../controllers/milestone/addProgressController'));
router.delete('/milestones/progress/:progressId', auth, require('../controllers/milestone/deleteProgressController'));
router.post('/milestones/:id/participants', auth, require('../controllers/milestone/setParticipantsController'));
router.post('/milestones/:id/reminders', auth, require('../controllers/milestone/addReminderController'));
router.delete('/milestones/reminders/:reminderId', auth, require('../controllers/milestone/deleteReminderController'));

// Files
router.post('/files/upload', auth, upload.single('file'), require('../controllers/file/uploadController'));
router.post('/files/url', auth, require('../controllers/file/addUrlController'));
router.post('/files/note', auth, require('../controllers/file/addNoteController'));
router.get('/files/all', auth, require('../controllers/file/listAllController'));
router.get('/files', auth, require('../controllers/file/listController'));
router.delete('/files/:id', auth, require('../controllers/file/deleteController'));
router.get('/files/:id/download', auth, require('../controllers/file/downloadController'));
router.get('/files/:id/preview', auth, require('../controllers/file/previewController'));

// Resource Groups
router.post('/resource-groups', auth, require('../controllers/resource/createGroupController'));
router.get('/resource-groups', auth, require('../controllers/resource/listGroupsController'));
router.get('/resource-groups/:id', auth, require('../controllers/resource/groupDetailController'));
router.delete('/resource-groups/:id', auth, require('../controllers/resource/deleteGroupController'));
router.post('/resource-groups/items', auth, upload.single('file'), require('../controllers/resource/addItemController'));

module.exports = router;
