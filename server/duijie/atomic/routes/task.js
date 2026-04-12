const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const enterprisePermGuard = require('../middleware/enterprisePermGuard');
const taskPermGuard = require('../middleware/taskPermGuard');
const reviewPointPermGuard = require('../middleware/reviewPointPermGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const upload = require('./upload');
const router = express.Router();

const taskStaff = roleGuard('admin', 'member');
const reviewPoints = require('../controllers/task/reviewPointsController');
const draftCtrl = require('../controllers/task/draftController');

// Drafts
router.get('/drafts', auth, draftCtrl.list);
router.post('/drafts', auth, upload.array('files', 10), draftCtrl.save);
router.delete('/drafts/:id', auth, draftCtrl.remove);

// Tasks
router.post('/tasks', auth, roleGuard('admin', 'member', { soft: true }), enterprisePermGuard('can_create_task'), upload.array('files', 10), require('../controllers/task/createController'));
router.get('/tasks/export', auth, require('../controllers/task/exportController'));
router.get('/tasks/trash', auth, taskStaff, require('../controllers/task/trashController'));
router.get('/tasks', auth, require('../controllers/task/listController'));
router.put('/tasks/:id', auth, taskStaff,
  taskPermGuard(['can_edit_task_title', 'can_edit_task_desc', 'can_edit_task_priority', 'can_edit_task_deadline', 'can_assign_task']),
  require('../controllers/task/updateController'));
router.patch('/tasks/:id/move', auth, taskStaff,
  taskPermGuard(['can_move_task_accept', 'can_move_task_dispute', 'can_move_task_supplement', 'can_move_task_submit_review', 'can_move_task_reject', 'can_move_task_approve', 'can_move_task_resubmit']),
  require('../controllers/task/moveController'));
router.post('/tasks/:id/remind', auth, taskStaff, require('../controllers/task/remindController'));
router.delete('/tasks/:id', auth, taskStaff, taskPermGuard('can_delete_task'), require('../controllers/task/deleteController'));
router.patch('/tasks/:id/restore', auth, taskStaff, taskPermGuard('can_delete_task'), require('../controllers/task/restoreController'));
router.post('/tasks/:id/attachments', auth, taskStaff, taskPermGuard('can_upload_task_attachment'), upload.array('files', 10), require('../controllers/task/uploadAttachmentController'));
router.delete('/tasks/attachments/:attachmentId', auth, taskStaff,
  reviewPointPermGuard('can_delete_task_attachment', { paramName: 'attachmentId', table: 'duijie_task_attachments', fk: 'task_id' }),
  require('../controllers/task/deleteAttachmentController'));
router.get('/tasks/attachments/:attachmentId/download', auth, require('../controllers/task/downloadAttachmentController'));

// 审核要点
router.get('/tasks/:id/review-points', auth, reviewPoints.list);
router.post('/tasks/:id/review-points', auth, taskStaff, taskPermGuard('can_add_review_point'), reviewPoints.add);
router.put('/tasks/review-points/:pointId', auth, taskStaff,
  reviewPointPermGuard('can_add_review_point', { paramName: 'pointId', table: 'duijie_task_review_points', fk: 'task_id' }),
  reviewPoints.update);
router.put('/tasks/review-points/:pointId/respond', auth, taskStaff,
  reviewPointPermGuard('can_respond_review_point', { paramName: 'pointId', table: 'duijie_task_review_points', fk: 'task_id' }),
  reviewPoints.respond);
router.put('/tasks/review-points/:pointId/confirm', auth, taskStaff,
  reviewPointPermGuard('can_confirm_review_point', { paramName: 'pointId', table: 'duijie_task_review_points', fk: 'task_id' }),
  reviewPoints.confirm);

// Milestones (代办/项目流程)
router.post('/milestones', auth, require('../controllers/milestone/createController'));
router.get('/milestones', auth, require('../controllers/milestone/listController'));
router.put('/milestones/:id', auth, require('../controllers/milestone/updateController'));
router.delete('/milestones/:id', auth, require('../controllers/milestone/deleteController'));
router.get('/milestones/trash', auth, require('../controllers/milestone/trashController'));
router.patch('/milestones/:id/restore', auth, require('../controllers/milestone/restoreController'));
router.patch('/milestones/:id/toggle', auth, require('../controllers/milestone/toggleController'));
router.patch('/milestones/:id/progress', auth, require('../controllers/milestone/updateProgressController'));
router.get('/milestones/:id/detail', auth, require('../controllers/milestone/detailController'));

// Milestone participants
router.get('/milestones/:id/participants', auth, require('../controllers/milestone/participantsController').list);
router.post('/milestones/:id/participants', auth, require('../controllers/milestone/participantsController').add);
router.delete('/milestones/:id/participants/:userId', auth, require('../controllers/milestone/participantsController').remove);

// Milestone messages (progress tracking)
router.get('/milestones/:id/messages', auth, require('../controllers/milestone/messagesController').list);
router.post('/milestones/:id/messages', auth, require('../controllers/milestone/messagesController').create);

// Milestone reminders
router.get('/milestones/:id/reminders', auth, require('../controllers/milestone/remindersController').list);
router.post('/milestones/:id/reminders', auth, require('../controllers/milestone/remindersController').create);
router.delete('/milestone-reminders/:reminderId', auth, require('../controllers/milestone/remindersController').remove);

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
router.put('/resource-groups/:id', auth, require('../controllers/resource/updateGroupController'));
router.delete('/resource-groups/:id', auth, require('../controllers/resource/deleteGroupController'));
router.post('/resource-groups/items', auth, upload.single('file'), require('../controllers/resource/addItemController'));
router.put('/resource-groups/items/:itemId', auth, require('../controllers/resource/updateItemController'));
router.delete('/resource-groups/items/:itemId', auth, require('../controllers/resource/deleteItemController'));

// Timesheets (工时汇报)
router.get('/timesheets', auth, require('../controllers/timesheet/listController'));
router.get('/timesheets/summary', auth, require('../controllers/timesheet/summaryController'));
router.post('/timesheets', auth, require('../controllers/timesheet/createController'));
router.put('/timesheets/:id', auth, require('../controllers/timesheet/updateController'));
router.delete('/timesheets/:id', auth, require('../controllers/timesheet/deleteController'));

module.exports = router;
